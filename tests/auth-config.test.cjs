const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  AuthConfigurationError,
  validateSupabaseConfiguration,
} = require('../dist/cjs');

test('fails closed when Supabase configuration is missing or placeholder', () => {
  assert.throws(
    () => validateSupabaseConfiguration({ supabaseUrl: '', supabaseAnonKey: '' }),
    AuthConfigurationError,
  );
  assert.throws(
    () => validateSupabaseConfiguration({
      supabaseUrl: 'https://your-project.supabase.co',
      supabaseAnonKey: 'your-anon-key-here',
    }),
    AuthConfigurationError,
  );
});

test('rejects insecure remote URLs and browser secret keys', () => {
  assert.throws(
    () => validateSupabaseConfiguration({ supabaseUrl: 'http://project.example.com', supabaseAnonKey: 'sb_publishable_test' }),
    /HTTPS/,
  );
  assert.throws(
    () => validateSupabaseConfiguration({ supabaseUrl: 'https://project.example.com', supabaseAnonKey: 'sb_secret_test' }),
    /must never/,
  );
});

test('accepts HTTPS and local development with publishable keys', () => {
  assert.doesNotThrow(() => validateSupabaseConfiguration({
    supabaseUrl: 'https://project.supabase.co',
    supabaseAnonKey: 'sb_publishable_test',
  }));
  assert.doesNotThrow(() => validateSupabaseConfiguration({
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'sb_publishable_test',
  }));
});

test('compiled package contains its public stylesheet', () => {
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'dist', 'styles.css')), true);
});
