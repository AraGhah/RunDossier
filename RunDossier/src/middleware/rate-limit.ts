import type { Request, Response, NextFunction } from 'express';
import { getClientIp } from '../utils/client-ip.js';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let opsSinceCleanup = 0;

function cleanupExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
  /** Optional extra key segment (e.g. email hash). */
  keySuffix?: (req: Request) => string;
}

export function rateLimit(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    opsSinceCleanup++;
    if (opsSinceCleanup >= 200) {
      opsSinceCleanup = 0;
      cleanupExpired(now);
    }

    const suffix = options.keySuffix?.(req) ?? '';
    const key = `${options.keyPrefix}:${getClientIp(req)}${suffix ? `:${suffix}` : ''}`;
    let bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count++;

    if (bucket.count > options.max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    next();
  };
}
