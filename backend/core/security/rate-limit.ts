import { Environment, getSecurityProfile } from '../../config/environments';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds?: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically clean up expired keys to prevent memory leak
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }

  public check(
    key: string,
    limit: number,
    windowMs: number
  ): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      // New or expired window
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetTimeMs: now + windowMs,
      };
    }

    if (record.count >= limit) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTimeMs: record.resetAt,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }

    record.count += 1;
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - record.count),
      resetTimeMs: record.resetAt,
    };
  }

  public reset(): void {
    this.store.clear();
  }
}

export const rateLimiterStore = new InMemoryRateLimiter();

export function checkRateLimit(
  clientIdentifier: string,
  endpointType: 'standard' | 'auth' = 'standard',
  customEnv?: Environment
): RateLimitResult {
  const envKey = customEnv || (process.env.NODE_ENV as Environment) || 'development';
  const profile = getSecurityProfile(envKey);

  if (!profile.rateLimit.enabled) {
    return {
      allowed: true,
      limit: 999999,
      remaining: 999999,
      resetTimeMs: Date.now() + 60000,
    };
  }

  const limit = endpointType === 'auth' ? profile.rateLimit.authMaxRequests : profile.rateLimit.maxRequests;
  const windowMs = endpointType === 'auth' ? profile.rateLimit.authWindowMs : profile.rateLimit.windowMs;
  const key = `${endpointType}:${clientIdentifier}`;

  return rateLimiterStore.check(key, limit, windowMs);
}
