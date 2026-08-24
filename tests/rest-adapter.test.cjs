const test = require('node:test');
const assert = require('node:assert/strict');
const { createRestAuthAdapter, AuthAdapterError } = require('../dist/cjs/rest');

test('REST adapter rejects insecure remote APIs', () => {
  assert.throws(
    () => createRestAuthAdapter({ baseUrl: 'http://auth.example.com' }),
    AuthAdapterError,
  );
});

test('REST adapter posts credentials and requires a session response', async () => {
  let received;
  const adapter = createRestAuthAdapter({
    baseUrl: 'https://auth.example.com',
    fetch: async (url, options) => {
      received = { url, options };
      return new Response(JSON.stringify({
        user: { id: 'user-1', email: 'user@example.com' },
        session: { user: { id: 'user-1', email: 'user@example.com' } },
      }), { status: 200 });
    },
  });

  const result = await adapter.signInWithPassword({ email: 'user@example.com', password: 'correct horse' });
  assert.equal(received.url, 'https://auth.example.com/auth/sign-in');
  assert.equal(received.options.credentials, 'include');
  assert.deepEqual(JSON.parse(received.options.body), { email: 'user@example.com', password: 'correct horse' });
  assert.equal(result.session.user.id, 'user-1');
});

test('REST adapter exposes password-reset and password-update endpoints', async () => {
  const requests = [];
  const adapter = createRestAuthAdapter({
    baseUrl: 'https://auth.example.com',
    fetch: async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) });
      return new Response(null, { status: 204 });
    },
  });

  await adapter.requestPasswordReset('user@example.com', 'https://app.example.com/auth/update-password');
  await adapter.updatePassword('new-password');
  assert.deepEqual(requests, [
    {
      url: 'https://auth.example.com/auth/password-reset',
      body: { email: 'user@example.com', redirectTo: 'https://app.example.com/auth/update-password' },
    },
    { url: 'https://auth.example.com/auth/update-password', body: { password: 'new-password' } },
  ]);
});
