const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getNextAppDirectory,
  parseProviders,
  restLoginPage,
  supabaseLoginPage,
  upsertEnv,
  validatePath,
  validatePublicKey,
  validateUrl,
} = require('../bin/init.cjs');

test('CLI env merge preserves unrelated values and updates only auth entries', () => {
  const existing = [
    'UNRELATED_SECRET=keep-me',
    'NEXT_PUBLIC_SUPABASE_URL=https://old.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=old-key',
    '',
  ].join('\n');

  const result = upsertEnv(existing, {
    NEXT_PUBLIC_SUPABASE_URL: 'https://new.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'new-public-key',
  });

  assert.match(result, /^UNRELATED_SECRET=keep-me/m);
  assert.match(result, /^NEXT_PUBLIC_SUPABASE_URL=https:\/\/new\.supabase\.co/m);
  assert.match(result, /^NEXT_PUBLIC_SUPABASE_ANON_KEY=new-public-key/m);
  assert.doesNotMatch(result, /old-key/);
});

test('CLI accepts local HTTP but rejects insecure remote URLs', () => {
  assert.doesNotThrow(() => validateUrl('http://localhost:54321'));
  assert.throws(() => validateUrl('http://project.example.com'), /HTTPS/);
});

test('CLI rejects secret keys', () => {
  assert.throws(() => validatePublicKey('sb_secret_example'), /secret\/service-role/);
  assert.doesNotThrow(() => validatePublicKey('sb_publishable_example'));
});

test('CLI accepts only supported OAuth provider names', () => {
  assert.deepEqual(parseProviders('google, github, google'), ['google', 'github']);
  assert.deepEqual(parseProviders(''), []);
  assert.throws(() => parseProviders('google, discord'), /Unsupported OAuth provider/);
});

test('CLI only generates pages for a detected Next.js App Router project', () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'webapp-login-ui-'));
  try {
    fs.mkdirSync(path.join(project, 'src', 'app'), { recursive: true });
    assert.equal(getNextAppDirectory(project, { dependencies: { next: '15.0.0' } }), 'src/app');
    assert.equal(getNextAppDirectory(project, { dependencies: {} }), undefined);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('CLI generates ready pages using the published package name', () => {
  const supabasePage = supabaseLoginPage({
    appUrl: 'http://localhost:3000',
    afterLoginPath: '/dashboard',
    providers: ['google'],
  });
  const restPage = restLoginPage({
    appUrl: 'http://localhost:3000',
    apiUrl: 'https://api.example.com',
    afterLoginPath: '/dashboard',
    providers: [],
  });
  assert.match(supabasePage, /from 'webapp-login-ui'/);
  assert.match(supabasePage, /oauthRedirectTo=\{`\$\{appUrl\}\/login`\}/);
  assert.match(restPage, /from 'webapp-login-ui\/rest'/);
  assert.match(restPage, /NEXT_PUBLIC_AUTH_API_URL/);
});

test('CLI accepts only safe generated route paths', () => {
  assert.equal(validatePath('/dashboard'), '/dashboard');
  assert.throws(() => validatePath('dashboard'), /start with one slash/);
  assert.throws(() => validatePath('//external.example'), /start with one slash/);
});
