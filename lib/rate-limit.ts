import "server-only";

/**
 * Minimal in-process rate limiter for the credential endpoints.
 *
 * Deliberately dependency-free and in-memory: it blunts password guessing and
 * signup spam from a single origin on a single instance. It is not a substitute
 * for an edge/WAF limit across a horizontally scaled deployment — swap the
 * backing store for Redis if this ever runs on more than one instance.
 */

type Bucket = { count: number; resetAt: number };

const globalForLimiter = globalThis as typeof globalThis & {
  __rexHavenRateLimit?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> = (globalForLimiter.__rexHavenRateLimit ??= new Map());

/** Drops expired buckets so the map can't grow without bound. */
function sweep(now: number): void {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets. Surfaced to the caller as a wait hint. */
  retryAfterSeconds: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Clears a bucket after a successful attempt, so honest users aren't punished. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client identifier. Proxy headers are spoofable, so this is a
 * throttling hint only — never an authorization input.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return `${scope}:${ip}`;
}
