// Production Email Validator & Disposable Mail Blocker
// Includes Gmail Canonicalization (Anti Dot-Trick & Plus-Trick Sub-addressing Abuse)
// Protects against header injection, multi-recipient commas, and disposable spam bots.

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'getairmail.com',
  'crazymailing.com',
  'fakeinbox.com',
  'nada.ltd',
  'mohmal.com',
  'mytemp.email',
  'dropmail.me'
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedEmail: string;
  canonicalEmail: string;
}

export function validateAndSanitizeEmail(rawEmail: string): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { isValid: false, error: 'Email address is required.', sanitizedEmail: '', canonicalEmail: '' };
  }

  // 1. Trim whitespace and lowercase
  const sanitized = rawEmail.trim().toLowerCase();

  // 2. Reject Multiple Recipient Injection (commas, semicolons, spaces, CRLF)
  if (sanitized.includes(',') || sanitized.includes(';') || sanitized.includes(' ') || sanitized.includes('\n') || sanitized.includes('\r')) {
    return {
      isValid: false,
      error: 'Invalid email format. Multiple addresses or special separators are not allowed.',
      sanitizedEmail: sanitized,
      canonicalEmail: sanitized
    };
  }

  // 3. Strict RFC 5322 standard regex (Ensures single valid mailbox)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(sanitized)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address.',
      sanitizedEmail: sanitized,
      canonicalEmail: sanitized
    };
  }

  // 4. Extract parts and check against disposable/temp-mail blocklist
  const parts = sanitized.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Invalid email structure.', sanitizedEmail: sanitized, canonicalEmail: sanitized };
  }

  let username = parts[0];
  let domain = parts[1];

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Temporary or disposable email domains are not allowed. Please use your business email or standard provider (Gmail, Outlook, Yahoo).',
      sanitizedEmail: sanitized,
      canonicalEmail: sanitized
    };
  }

  // 5. Gmail Canonicalization (Anti Dot-Trick & Plus-Subaddressing Trick)
  // Google ignores all dots (.) and plus tags (+tag) in Gmail usernames.
  // Example: r.a.h.i.m.khan+trial@gmail.com -> rahimkhan@gmail.com
  let canonicalUser = username;
  let canonicalDomain = domain;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    canonicalDomain = 'gmail.com';
    // Remove all dots
    canonicalUser = canonicalUser.replace(/\./g, '');
    // Strip plus sub-addressing (+tag)
    canonicalUser = canonicalUser.split('+')[0];
  }

  const canonicalEmail = `${canonicalUser}@${canonicalDomain}`;

  return { 
    isValid: true, 
    sanitizedEmail: sanitized, 
    canonicalEmail 
  };
}
