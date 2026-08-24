const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_LOGIN_RATE_LIMIT, MemoryRateLimiter, getRequestIp } = require('../dist/cjs/server');

test('memory limiter blocks repeated attempts for the configured lockout period', () => {
  const limiter = new MemoryRateLimiter();
  const start = 1_000_000;
  for (let attempt = 0; attempt < DEFAULT_LOGIN_RATE_LIMIT.maxAttempts; attempt += 1) {
    assert.equal(limiter.check('ip:203.0.113.1', DEFAULT_LOGIN_RATE_LIMIT, start + attempt).allowed, true);
  }
  const blocked = limiter.check('ip:203.0.113.1', DEFAULT_LOGIN_RATE_LIMIT, start + 10);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);

  limiter.reset('ip:203.0.113.1');
  assert.equal(limiter.check('ip:203.0.113.1', DEFAULT_LOGIN_RATE_LIMIT, start + 11).allowed, true);
});

test('extracts the first forwarded client address', () => {
  assert.equal(getRequestIp({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' }), '203.0.113.1');
});
