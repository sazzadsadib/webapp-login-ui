#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { spawnSync } = require('node:child_process');

const PACKAGE_NAME = 'webapp-login-ui';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

function isYes(answer, defaultValue = false) {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return defaultValue;
  return normalized === 'y' || normalized === 'yes';
}

async function askUntilValid(question, validate) {
  while (true) {
    const answer = await ask(question);
    try {
      return validate(answer.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      console.log(`That does not look right: ${message} Please try again.`);
    }
  }
}

function validateUrl(value, label = 'URL') {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL.`);
  }

  const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !local) {
    throw new Error(`${label} must use HTTPS outside local development.`);
  }
  return parsed.toString().replace(/\/$/, '');
}

function jwtRole(key) {
  const payload = key.split('.')[1];
  if (!payload) return undefined;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role;
  } catch {
    return undefined;
  }
}

function validatePublicKey(key) {
  if (!key) throw new Error('Supabase anon/publishable key is required.');
  if (key.startsWith('sb_secret_') || jwtRole(key) === 'service_role') {
    throw new Error('Do not use a secret/service-role key. Enter an anon or publishable key.');
  }
}

function validatePath(value, label = 'Path') {
  if (!value.startsWith('/') || value.startsWith('//') || /[\r\n]/.test(value)) {
    throw new Error(`${label} must start with one slash and must not contain line breaks.`);
  }
  return value;
}

function upsertEnv(content, entries) {
  const lines = content ? content.replace(/\r\n/g, '\n').split('\n') : [];
  const remaining = new Map(Object.entries(entries));
  const output = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match || !remaining.has(match[1])) return line;
    const key = match[1];
    const value = remaining.get(key);
    remaining.delete(key);
    return `${key}=${value}`;
  });

  if (output.length && output[output.length - 1] !== '') output.push('');
  if (remaining.size) {
    output.push('# WebApp Login UI');
    for (const [key, value] of remaining) output.push(`${key}=${value}`);
  }
  if (output[output.length - 1] !== '') output.push('');
  return output.join('\n');
}

function parseProviders(value) {
  const allowed = new Set(['google', 'facebook', 'apple', 'github']);
  const providers = value
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);
  const invalid = providers.filter((provider) => !allowed.has(provider));
  if (invalid.length) {
    throw new Error(`Unsupported OAuth provider: ${invalid.join(', ')}. Use google, facebook, apple, or github.`);
  }
  return [...new Set(providers)];
}

function readProject(projectRoot) {
  const packagePath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error('Run this command inside an existing JavaScript/TypeScript project folder containing package.json.');
  }
  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch {
    throw new Error('package.json could not be read as valid JSON.');
  }
}

function getNextAppDirectory(projectRoot, packageJson) {
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  if (!dependencies.next) return undefined;
  for (const candidate of ['src/app', 'app']) {
    if (fs.existsSync(path.join(projectRoot, candidate))) return candidate;
  }
  return undefined;
}

function detectPackageManager(projectRoot) {
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function installPackage(projectRoot, dependencies, packageManager = detectPackageManager(projectRoot)) {
  const commands = {
    npm: ['install', ...dependencies],
    pnpm: ['add', ...dependencies],
    yarn: ['add', ...dependencies],
  };
  const result = spawnSync(packageManager, commands[packageManager], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Could not install ${dependencies.join(', ')} with ${packageManager}. Fix the install error and run the command again.`);
  }
}

function backupEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return undefined;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${envPath}.webapp-login-ui-${timestamp}.bak`;
  fs.copyFileSync(envPath, backupPath);
  return backupPath;
}

async function writeGeneratedFile(target, content) {
  if (fs.existsSync(target)) {
    const replace = await ask(`${path.relative(process.cwd(), target)} already exists. Replace it? [y/N]: `);
    if (!isYes(replace)) return false;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, { encoding: 'utf8', mode: 0o600 });
  return true;
}

function supabaseLoginPage({ appUrl, afterLoginPath, providers }) {
  return `'use client';

import { AuthCard } from '${PACKAGE_NAME}';
import '${PACKAGE_NAME}/styles.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ${JSON.stringify(appUrl)};

export default function LoginPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <AuthCard
        oauthProviders={${JSON.stringify(providers)}}
        oauthRedirectTo={\`${'${appUrl}'}/login\`}
        passwordResetRedirectTo={\`${'${appUrl}'}/auth/update-password\`}
        onSuccess={() => window.location.assign(${JSON.stringify(afterLoginPath)})}
      />
    </main>
  );
}
`;
}

function restLoginPage({ appUrl, apiUrl, afterLoginPath, providers }) {
  return `'use client';

import { AuthCard } from '${PACKAGE_NAME}';
import { createRestAuthAdapter } from '${PACKAGE_NAME}/rest';
import '${PACKAGE_NAME}/styles.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ${JSON.stringify(appUrl)};
const auth = createRestAuthAdapter({
  baseUrl: process.env.NEXT_PUBLIC_AUTH_API_URL ?? ${JSON.stringify(apiUrl)},
});

export default function LoginPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <AuthCard
        adapter={auth}
        oauthProviders={${JSON.stringify(providers)}}
        oauthRedirectTo={\`${'${appUrl}'}/login\`}
        passwordResetRedirectTo={\`${'${appUrl}'}/auth/update-password\`}
        onSuccess={() => window.location.assign(${JSON.stringify(afterLoginPath)})}
      />
    </main>
  );
}
`;
}

function supabaseUpdatePasswordPage() {
  return `'use client';

import { UpdatePasswordForm } from '${PACKAGE_NAME}';
import '${PACKAGE_NAME}/styles.css';

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm onSuccess={() => window.location.assign('/login')} />;
}
`;
}

function restUpdatePasswordPage(apiUrl) {
  return `'use client';

import { UpdatePasswordForm } from '${PACKAGE_NAME}';
import { createRestAuthAdapter } from '${PACKAGE_NAME}/rest';
import '${PACKAGE_NAME}/styles.css';

const auth = createRestAuthAdapter({
  baseUrl: process.env.NEXT_PUBLIC_AUTH_API_URL ?? ${JSON.stringify(apiUrl)},
});

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm adapter={auth} onSuccess={() => window.location.assign('/login')} />;
}
`;
}

function setupGuide({ backend, appUrl, providers, apiUrl }) {
  const common = `# WebApp Login UI setup\n\nCreated by \`npx ${PACKAGE_NAME}\`.\n\n- Login page: ${appUrl}/login\n- Password update page: ${appUrl}/auth/update-password\n- OAuth providers: ${providers.length ? providers.join(', ') : 'none'}\n`;
  if (backend === 'supabase') {
    return `${common}\n## Finish in Supabase\n\n1. Enable Email login in Supabase Authentication.\n2. Add the two URLs above to Authentication → URL Configuration → Redirect URLs.\n3. Enable only the listed OAuth providers and paste their provider credentials in Supabase.\n4. Test signup confirmation, sign-in, password recovery, and each enabled provider.\n5. Review the optional RLS template in \`node_modules/${PACKAGE_NAME}/templates/supabase/webapp-login-rls.sql\` before using it.\n`;
  }
  return `${common}\n## Finish in your backend\n\n- API base URL: ${apiUrl}\n- Implement the five endpoints in \`node_modules/${PACKAGE_NAME}/docs/custom-rest-contract.md\`.\n- Keep database credentials and password hashing on the server.\n- Add shared rate limiting and authorization before production.\n`;
}

async function chooseBackend() {
  while (true) {
    const choice = (await ask(
      "Where are your users' accounts stored?\n  1. Supabase — I want the easiest setup\n  2. My own server/API — I already have a login backend\nChoose 1 or 2: ",
    )).trim();
    if (choice === '1') return 'supabase';
    if (choice === '2') return 'rest';
    console.log('Please type 1 for Supabase or 2 for your own API.');
  }
}

async function installSecuritySkill(projectRoot) {
  const answer = await ask('Install the optional AI security checklist too? [Y/n]: ');
  if (!isYes(answer, true)) return;

  const source = path.join(__dirname, '..', 'skills', 'login-security-checks', 'SKILL.md');
  const targetDirectory = path.join(projectRoot, '.agents', 'skills', 'login-security-checks');
  const target = path.join(targetDirectory, 'SKILL.md');
  if (!fs.existsSync(source)) throw new Error('Bundled security checklist is missing from the package.');
  fs.mkdirSync(targetDirectory, { recursive: true });
  fs.copyFileSync(source, target);
  console.log('Security checklist installed.');
}

async function main() {
  const projectRoot = process.cwd();
  const packageJson = readProject(projectRoot);
  const appDirectory = getNextAppDirectory(projectRoot, packageJson);
  if (!appDirectory) {
    console.log('I could not find a Next.js App Router project. Run this command from a project that has an app/ or src/app/ folder. Nothing was changed.');
    return;
  }

  console.log('\nWebApp Login UI — guided setup');
  console.log('I will ask only for safe browser settings. Never paste a database password, service key, or admin key here.\n');
  const backend = await chooseBackend();
  const appUrl = await askUntilValid(
    "What is your app's web address? Press Enter for http://localhost:3000: ",
    (value) => validateUrl(value || 'http://localhost:3000', 'App URL'),
  );
  const afterLoginPath = await askUntilValid(
    'After login, which page should open? Press Enter for /dashboard: ',
    (value) => validatePath(value || '/dashboard', 'After-login page'),
  );
  const providers = await askUntilValid(
    'Do you want social login buttons? Type names separated by commas (google, github, facebook, apple), or press Enter for none: ',
    parseProviders,
  );
  const envEntries = { NEXT_PUBLIC_APP_URL: appUrl };
  let apiUrl;

  if (backend === 'supabase') {
    const supabaseUrl = await askUntilValid(
      'Paste your Supabase Project URL. Example: https://abccompany.supabase.co: ',
      (value) => validateUrl(value, 'Supabase Project URL'),
    );
    const supabaseKey = await askUntilValid('Paste your Supabase anon or publishable key. Do not paste a service-role or secret key: ', (value) => {
      validatePublicKey(value);
      return value;
    });
    Object.assign(envEntries, {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
    });
  } else {
    console.log('\nYour API must already handle login securely. I will connect the login screen to it; I will not ask for your database password.');
    apiUrl = await askUntilValid(
      'Paste the public HTTPS address of your existing login API. Example: https://api.example.com: ',
      (value) => validateUrl(value, 'Auth API URL'),
    );
    Object.assign(envEntries, { NEXT_PUBLIC_AUTH_API_URL: apiUrl });
  }

  const proceed = await ask(`I am ready to install ${PACKAGE_NAME}, create the login pages, and update .env.local. Existing files will never be replaced without asking. Continue? [Y/n]: `);
  if (!isYes(proceed, true)) {
    console.log('Nothing was changed.');
    return;
  }

  installPackage(projectRoot, backend === 'supabase' ? [PACKAGE_NAME, '@supabase/supabase-js'] : [PACKAGE_NAME]);
  const envPath = path.join(projectRoot, '.env.local');
  const existingEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const backup = existingEnv ? backupEnvFile(envPath) : undefined;
  fs.writeFileSync(envPath, upsertEnv(existingEnv, envEntries), { encoding: 'utf8', mode: 0o600 });
  if (backup) console.log(`I saved a backup of your existing environment file: ${path.basename(backup)}`);

  const loginPath = path.join(projectRoot, appDirectory, 'login', 'page.tsx');
  const resetPath = path.join(projectRoot, appDirectory, 'auth', 'update-password', 'page.tsx');
  const guidePath = path.join(projectRoot, 'WEBAPP_LOGIN_SETUP.md');
  const loginCreated = await writeGeneratedFile(
    loginPath,
    backend === 'supabase'
      ? supabaseLoginPage({ appUrl, afterLoginPath, providers })
      : restLoginPage({ appUrl, apiUrl, afterLoginPath, providers }),
  );
  const resetCreated = await writeGeneratedFile(
    resetPath,
    backend === 'supabase' ? supabaseUpdatePasswordPage() : restUpdatePasswordPage(apiUrl),
  );
  await writeGeneratedFile(guidePath, setupGuide({ backend, appUrl, providers, apiUrl }));
  await installSecuritySkill(projectRoot);

  console.log('\nSetup complete.');
  if (loginCreated) console.log('Created your login page.');
  if (resetCreated) console.log('Created your password-update page.');
  console.log('Open WEBAPP_LOGIN_SETUP.md next. It tells you the final Supabase or API steps before going live.');
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exitCode = 1;
    })
    .finally(() => rl.close());
} else {
  rl.close();
}

module.exports = {
  detectPackageManager,
  getNextAppDirectory,
  parseProviders,
  restLoginPage,
  supabaseLoginPage,
  upsertEnv,
  validatePath,
  validatePublicKey,
  validateUrl,
};
