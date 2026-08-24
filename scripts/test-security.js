// Automated Security Unit Test Suite for secure-auth-kit

const { validateAndSanitizeEmail } = require('../src/lib/emailValidator.ts');

console.log('======================================================');
console.log('🛡️  SECURE AUTH KIT — SECURITY REGRESSION TEST SUITE');
console.log('======================================================\n');

let passCount = 0;
let failCount = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`[PASS] ✅ ${description}`);
    passCount++;
  } else {
    console.error(`[FAIL] ❌ ${description}`);
    failCount++;
  }
}

// Test 1: Gmail Dot-Trick Stripping
const t1 = validateAndSanitizeEmail('r.a.h.i.m.k.h.a.n@gmail.com');
assert('Gmail Dot-Trick: "r.a.h.i.m.k.h.a.n@gmail.com" normalizes to "rahimkhan@gmail.com"', t1.canonicalEmail === 'rahimkhan@gmail.com');

// Test 2: Gmail Plus-Trick Stripping
const t2 = validateAndSanitizeEmail('rahimkhan+freetrial99@gmail.com');
assert('Gmail Plus-Trick: "rahimkhan+freetrial99@gmail.com" normalizes to "rahimkhan@gmail.com"', t2.canonicalEmail === 'rahimkhan@gmail.com');

// Test 3: Temp-Mail Blocking
const t3 = validateAndSanitizeEmail('scammer@tempmail.com');
assert('Disposable Email Block: "scammer@tempmail.com" is strictly rejected', t3.isValid === false);

// Test 4: Multi-Recipient Comma Injection Blocking
const t4 = validateAndSanitizeEmail('victim@gmail.com,attacker@gmail.com');
assert('Header Injection Block: "victim@gmail.com,attacker@gmail.com" is strictly rejected', t4.isValid === false);

// Test 5: Standard Valid Email
const t5 = validateAndSanitizeEmail('john.doe@company.com');
assert('Standard Business Email: "john.doe@company.com" preserves dot for non-Gmail domain', t5.isValid === true && t5.canonicalEmail === 'john.doe@company.com');

console.log('\n------------------------------------------------------');
console.log(`RESULTS: ${passCount} Passed, ${failCount} Failed`);
console.log('------------------------------------------------------\n');

if (failCount > 0) process.exit(1);
