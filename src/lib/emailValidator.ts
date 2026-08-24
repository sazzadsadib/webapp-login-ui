const DEFAULT_DISPOSABLE_DOMAINS = Object.freeze([
  '10minutemail.com',
  '10minutemail.net',
  'crazymailing.com',
  'dispostable.com',
  'dropmail.me',
  'fakeinbox.com',
  'getairmail.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'mailinator.com',
  'mohmal.com',
  'mytemp.email',
  'nada.ltd',
  'sharklasers.com',
  'temp-mail.org',
  'tempmail.com',
  'trashmail.com',
  'yopmail.com',
] as const);

export interface EmailValidationOptions {
  canonicalizeGmail?: boolean;
  blockDisposableEmail?: boolean;
  additionalDisposableDomains?: Iterable<string>;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedEmail: string;
  canonicalEmail: string;
}

function invalid(error: string, sanitizedEmail = ''): EmailValidationResult {
  return { isValid: false, error, sanitizedEmail, canonicalEmail: '' };
}

function isBlockedDomain(domain: string, blockedDomains: Set<string>): boolean {
  for (const blocked of blockedDomains) {
    if (domain === blocked || domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export function validateAndSanitizeEmail(
  rawEmail: string,
  options: EmailValidationOptions = {},
): EmailValidationResult {
  if (typeof rawEmail !== 'string' || rawEmail.length === 0) {
    return invalid('Email address is required.');
  }

  if (/[,;\s\r\n]/.test(rawEmail)) {
    return invalid('Invalid email format. Whitespace, multiple addresses, and separators are not allowed.');
  }

  if (rawEmail.length > 254) return invalid('Email address is too long.');

  const atIndex = rawEmail.lastIndexOf('@');
  if (atIndex <= 0 || atIndex !== rawEmail.indexOf('@')) {
    return invalid('Please enter a valid email address.');
  }

  const rawLocalPart = rawEmail.slice(0, atIndex);
  const domain = rawEmail.slice(atIndex + 1).toLowerCase();
  const localPart = rawLocalPart.toLowerCase();
  const sanitizedEmail = `${localPart}@${domain}`;

  if (
    localPart.length > 64 ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..')
  ) {
    return invalid('Please enter a valid email address.', sanitizedEmail);
  }

  const localPartRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  const domainRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
  if (!localPartRegex.test(localPart) || !domainRegex.test(domain)) {
    return invalid('Please enter a valid email address.', sanitizedEmail);
  }

  const blockedDomains = new Set<string>(DEFAULT_DISPOSABLE_DOMAINS);
  for (const extraDomain of options.additionalDisposableDomains ?? []) {
    const normalized = extraDomain.trim().toLowerCase();
    if (normalized) blockedDomains.add(normalized);
  }

  if (options.blockDisposableEmail !== false && isBlockedDomain(domain, blockedDomains)) {
    return invalid(
      'Temporary or disposable email domains are not allowed. Please use a permanent email address.',
      sanitizedEmail,
    );
  }

  let canonicalUser = localPart;
  let canonicalDomain = domain;
  if (
    options.canonicalizeGmail !== false &&
    (domain === 'gmail.com' || domain === 'googlemail.com')
  ) {
    canonicalDomain = 'gmail.com';
    canonicalUser = canonicalUser.replace(/\./g, '').split('+')[0];
  }

  if (!canonicalUser) return invalid('Please enter a valid email address.', sanitizedEmail);

  return {
    isValid: true,
    sanitizedEmail,
    canonicalEmail: `${canonicalUser}@${canonicalDomain}`,
  };
}

export { DEFAULT_DISPOSABLE_DOMAINS };
