---
name: login-security-checks
description: >-
  Mandatory production security checklist and implementation rules for any web application
  or API featuring user authentication, registration, login, password reset, or OTP flows.
  Prevents Gmail dot-trick/plus-trick multi-account abuse, disposable/temp-mail bots,
  email header injection, brute force, and multi-tenant data leakage.
---

# Login & Auth Security Checks (Production Standard)

Whenever building or reviewing any authentication system, login page, registration flow, or password recovery mechanism, **ALWAYS** enforce these 5 mandatory security rules.

---

## 1. Gmail Canonicalization (Anti Dot-Trick & Plus-Addressing Abuse)
* **Threat:** Google ignores `.` and `+tag` in Gmail addresses (`r.a.h.i.m.k.h.a.n@gmail.com` vs `rahimkhan+free@gmail.com`). Attackers use this to create infinite fake accounts and drain free trial credits from a single inbox.
* **Rule:** If domain is `gmail.com` or `googlemail.com`:
  1. Strip all dots (`.`) from username: `username.replace(/\./g, '')`
  2. Strip plus tag (`+`): `username.split('+')[0]`
  3. Store and check uniqueness on **`canonicalEmail`** (`rahimkhan@gmail.com`).

---

## 2. Disposable / Temporary Email Blocker
* **Threat:** Bot spam accounts generated via 10-minute temporary email providers (`tempmail.com`, `guerrillamail.com`, `mailinator.com`, `10minutemail.com`, `yopmail.com`).
* **Rule:** Check the email domain against a disposable domain blocklist. Reject disposable domains with a clear message requesting a valid business or personal email.

---

## 3. Multi-Recipient & Header Injection Prevention
* **Threat:** Attackers enter `victim@domain.com,attacker@domain.com` or CRLF carriage returns (`\r\n`) in Forgot Password to trigger reset OTPs to multiple recipients simultaneously.
* **Rule:**
  1. Reject any email containing `,`, `;`, spaces, `\n`, or `\r`.
  2. Validate with strict RFC 5322 regex.
  3. Query database with exact parameterized queries (`WHERE email = $1`).

---

## 4. Rate Limiting & Brute Force Protection
* **Threat:** Automated scripts guessing credentials on `/login` or `/forgot-password`.
* **Rule:**
  1. Cap auth endpoint requests to max 5 failed attempts per 15 mins per IP.
  2. Return `HTTP 429 Too Many Requests` on breach.

---

## 5. Multi-Tenant RLS & JWT Isolation
* **Threat:** Unauthorized access to another user's private store data via direct API/terminal queries.
* **Rule:**
  1. Enforce PostgreSQL Row Level Security (RLS) with `tenant_id = auth.uid()`.
  2. Never store plaintext passwords; hash with **Bcrypt** (cost >= 10) or **Argon2id**.

---

## Portable Reference Module (`emailValidator.ts`)

```typescript
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'mailinator.com',
  'tempmail.com', 'temp-mail.org', 'trashmail.com', 'yopmail.com', 'sharklasers.com',
  'dispostable.com', 'getairmail.com', 'crazymailing.com', 'fakeinbox.com', 'nada.ltd'
]);

export function validateAndSanitizeEmail(rawEmail: string) {
  if (!rawEmail || typeof rawEmail !== 'string') return { isValid: false, error: 'Email required' };
  const sanitized = rawEmail.trim().toLowerCase();

  // Multi-recipient / Header injection check
  if (/[,;\s\r\n]/.test(sanitized)) {
    return { isValid: false, error: 'Multiple recipients or special separators are not allowed.' };
  }

  // RFC 5322 Regex check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  if (!emailRegex.test(sanitized)) return { isValid: false, error: 'Invalid email address format.' };

  const [username, domain] = sanitized.split('@');
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { isValid: false, error: 'Temporary or disposable emails are not allowed.' };
  }

  // Gmail Canonicalization
  let canonicalUser = username;
  let canonicalDomain = domain;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    canonicalDomain = 'gmail.com';
    canonicalUser = canonicalUser.replace(/\./g, '').split('+')[0];
  }

  return {
    isValid: true,
    sanitizedEmail: sanitized,
    canonicalEmail: `${canonicalUser}@${canonicalDomain}`
  };
}
```
