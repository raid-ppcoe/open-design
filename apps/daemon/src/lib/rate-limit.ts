import type { Request, RequestHandler, Response } from 'express';

// ponytail: in-memory fixed-window limiter, single-process. The daemon is a
// single local process, so a shared Map is the whole story. If the daemon ever
// runs multi-instance behind a shared front door, swap the store for Redis.

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Window length in milliseconds. Default 60_000 (1 minute). */
  windowMs?: number;
  /** Max requests per key per window. Default 120. */
  max?: number;
  /** Derive the bucket key from the request. Default: client IP. */
  keyFn?: (req: Request) => string;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 120;

function clientKey(req: Request): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Fixed-window rate limiter. Each returned handler owns its own store so limits
 * on different routes do not share counters. Exceeding the window returns 429.
 */
export function rateLimit(options: RateLimitOptions = {}): RequestHandler {
  // Escape hatch: disabled under tests and via env so batch/e2e traffic and
  // scripted CLI loops against a single local IP don't trip 429s.
  if (process.env.OD_DISABLE_RATE_LIMIT === '1' || process.env.NODE_ENV === 'test') {
    return (_req: Request, _res: Response, next: (err?: unknown) => void) => next();
  }

  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options.max ?? DEFAULT_MAX;
  const keyFn = options.keyFn ?? clientKey;
  const store = new Map<string, Bucket>();

  return (req: Request, res: Response, next: (err?: unknown) => void) => {
    const now = Date.now();
    const key = keyFn(req);
    let bucket = store.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      store.set(key, bucket);
    }
    bucket.count += 1;

    // Opportunistic cleanup so the map can't grow unbounded across many keys.
    if (store.size > 10_000) {
      for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
    }

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
      res.status(429).json({ error: { code: 'rate-limited', message: 'Too many requests' } });
      return;
    }
    next();
  };
}

/** Shared limiter for read/status endpoints — generous. */
export const readRateLimit = (): RequestHandler => rateLimit({ windowMs: 60_000, max: 300 });

/** Shared limiter for mutating/expensive endpoints — tighter. */
export const writeRateLimit = (): RequestHandler => rateLimit({ windowMs: 60_000, max: 60 });
