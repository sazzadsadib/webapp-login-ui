export interface RateLimitPolicy {
  windowMs: number;
  maxAttempts: number;
  lockoutMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface RateLimitEntry {
  attempts: number[];
  lockedUntil: number;
}

export class MemoryRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  check(key: string, policy: RateLimitPolicy, now = Date.now()): RateLimitResult {
    if (!key) throw new Error('A stable rate-limit key is required.');
    if (policy.windowMs <= 0 || policy.maxAttempts <= 0) throw new Error('Rate-limit policy values must be positive.');

    const previous = this.entries.get(key) ?? { attempts: [], lockedUntil: 0 };
    if (previous.lockedUntil > now) {
      return { allowed: false, remaining: 0, retryAfterMs: previous.lockedUntil - now };
    }

    const attempts = previous.attempts.filter((attempt) => attempt > now - policy.windowMs);
    if (attempts.length >= policy.maxAttempts) {
      const retryAfterMs = policy.lockoutMs ?? Math.max(0, attempts[0] + policy.windowMs - now);
      this.entries.set(key, { attempts, lockedUntil: now + retryAfterMs });
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    attempts.push(now);
    this.entries.set(key, { attempts, lockedUntil: 0 });
    return { allowed: true, remaining: policy.maxAttempts - attempts.length, retryAfterMs: 0 };
  }

  reset(key: string): void {
    this.entries.delete(key);
  }
}

export const DEFAULT_LOGIN_RATE_LIMIT: RateLimitPolicy = Object.freeze({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  lockoutMs: 15 * 60 * 1000,
});

/**
 * Use only when a trusted reverse proxy overwrites x-forwarded-for. Otherwise
 * pass a platform-provided client address to the limiter instead.
 */
export function getRequestIp(headers: Headers | Record<string, string | undefined>): string | undefined {
  const forwarded = headers instanceof Headers ? headers.get('x-forwarded-for') : headers['x-forwarded-for'];
  return forwarded?.split(',')[0]?.trim() || undefined;
}

export {
  DEFAULT_DISPOSABLE_DOMAINS,
  validateAndSanitizeEmail,
  type EmailValidationOptions,
  type EmailValidationResult,
} from './lib/emailValidator';
