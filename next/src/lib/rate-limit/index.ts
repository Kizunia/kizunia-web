import prisma from "@/lib/prisma";

export interface RateLimitRule {
  /** Namespaces the counter so two routes never share a budget. */
  readonly scope: string;

  /** Requests allowed per window. */
  readonly limit: number;

  /** Window length in seconds. */
  readonly windowSeconds: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  /** Seconds until the current window ends — suitable for `Retry-After`. */
  readonly retryAfterSeconds: number;
}

/**
 * Fixed-window rate limiting, counted in Postgres.
 *
 * Postgres rather than memory because the limiter has to hold across
 * instances. An in-memory counter quietly stops limiting the moment the app
 * runs in more than one process — which is precisely when a quota is at risk —
 * and this project has no Redis to reach for. One upsert per request is
 * negligible next to the billed provider call it exists to prevent.
 *
 * Fixed windows can allow a burst spanning a boundary. That is accepted: the
 * goal is bounding provider spend, not smoothing traffic, and a sliding window
 * costs more storage and complexity than the problem warrants.
 *
 * Fails open. If the counter itself is unavailable the request proceeds —
 * a limiter outage should degrade protection, not take the feature down.
 */
export async function checkRateLimit(
  identifier: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const windowMs = rule.windowSeconds * 1_000;

  const now = Date.now();

  const windowStart = Math.floor(now / windowMs) * windowMs;

  const key = `${rule.scope}:${identifier}:${windowStart}`;

  const expiresAt = new Date(windowStart + windowMs);

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((expiresAt.getTime() - now) / 1_000),
  );

  try {
    // The atomic increment is what makes this correct under concurrency:
    // read-then-write would let simultaneous requests observe the same count
    // and each conclude they were within the limit.
    const record = await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: { increment: 1 } },
    });

    return {
      allowed: record.count <= rule.limit,
      remaining: Math.max(0, rule.limit - record.count),
      retryAfterSeconds,
    };
  } catch (error) {
    console.warn("Rate limit check failed; allowing the request.", error);

    return {
      allowed: true,
      remaining: rule.limit,
      retryAfterSeconds,
    };
  }
}

/**
 * Best-effort identifier for an unauthenticated caller.
 *
 * Proxy headers are spoofable, so this bounds accidental and casual abuse
 * rather than a determined attacker. Callers that can identify a user should
 * prefer the user id.
 */
export function clientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Removes expired counters. Safe to run at any time; purely housekeeping. */
export async function pruneRateLimits(): Promise<number> {
  const { count } = await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return count;
}
