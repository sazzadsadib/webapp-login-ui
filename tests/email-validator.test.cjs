const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAndSanitizeEmail } = require('../dist/cjs');

test('canonicalizes Gmail dots, tags, and googlemail domain', () => {
  assert.equal(validateAndSanitizeEmail('r.a.h.i.m+trial@gmail.com').canonicalEmail, 'rahim@gmail.com');
  assert.equal(validateAndSanitizeEmail('User.Name@googlemail.com').canonicalEmail, 'username@gmail.com');
});

test('keeps non-Gmail plus aliases and dots', () => {
  const result = validateAndSanitizeEmail('John.Doe+alerts@Example.com');
  assert.equal(result.isValid, true);
  assert.equal(result.canonicalEmail, 'john.doe+alerts@example.com');
});

test('rejects header injection, whitespace, and multiple recipients', () => {
  for (const email of [
    'victim@example.com,attacker@example.com',
    'victim@example.com;attacker@example.com',
    ' victim@example.com',
    'victim@example.com\r\nBcc:attacker@example.com',
  ]) {
    assert.equal(validateAndSanitizeEmail(email).isValid, false, email);
  }
});

test('rejects invalid local parts and empty Gmail canonical users', () => {
  for (const email of ['.foo@gmail.com', 'foo..bar@example.com', 'foo.@example.com', '+tag@gmail.com']) {
    assert.equal(validateAndSanitizeEmail(email).isValid, false, email);
  }
});

test('blocks disposable domains and their subdomains', () => {
  assert.equal(validateAndSanitizeEmail('user@mailinator.com').isValid, false);
  assert.equal(validateAndSanitizeEmail('user@sub.mailinator.com').isValid, false);
});

test('supports consumer-supplied disposable domains and policy opt-out', () => {
  assert.equal(
    validateAndSanitizeEmail('user@example.test', { additionalDisposableDomains: ['example.test'] }).isValid,
    false,
  );
  assert.equal(
    validateAndSanitizeEmail('user@mailinator.com', { blockDisposableEmail: false }).isValid,
    true,
  );
});

test('enforces email length and basic domain structure', () => {
  assert.equal(validateAndSanitizeEmail(`${'a'.repeat(65)}@example.com`).isValid, false);
  assert.equal(validateAndSanitizeEmail('user@localhost').isValid, false);
  assert.equal(validateAndSanitizeEmail('user@-example.com').isValid, false);
});
