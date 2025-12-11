/**
 * Simple in-memory rate limiter
 * In production, consider using Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @returns Object with allowed status and remaining requests
   */
  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // No entry or window expired - create new entry
    if (!entry || now > entry.resetTime) {
      const resetTime = now + this.windowMs;
      this.store.set(identifier, {
        count: 1,
        resetTime,
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for an identifier (useful for testing)
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }
}

// Create rate limiter: 10 requests per minute per IP
export const rateLimiter = new RateLimiter(60 * 1000, 10);

/**
 * Get client identifier from request
 */
export function getClientIdentifier(req: any): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers?.["x-real-ip"];
  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address
  return req.connection?.remoteAddress || "unknown";
}

