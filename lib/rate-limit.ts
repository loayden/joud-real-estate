import { Ratelimit } from "@upstash/ratelimit";

export type RateLimiter = Ratelimit | InMemoryRateLimiter;

class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  limit(identifier: string) {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetAt) {
      this.store.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      };
    }

    entry.count++;
    const remaining = Math.max(0, this.maxRequests - entry.count);

    return {
      success: entry.count <= this.maxRequests,
      limit: this.maxRequests,
      remaining,
      reset: entry.resetAt,
    };
  }
}

const memoryAuth = new InMemoryRateLimiter(5, 60_000);
const memorySearch = new InMemoryRateLimiter(30, 60_000);
const memoryInquiry = new InMemoryRateLimiter(5, 300_000);
const memoryUpload = new InMemoryRateLimiter(20, 60_000);
const memoryReport = new InMemoryRateLimiter(10, 86_400_000);
const memoryView = new InMemoryRateLimiter(10, 60_000);
const memoryPasswordChange = new InMemoryRateLimiter(5, 900_000);
const memoryVerifyEmail = new InMemoryRateLimiter(5, 900_000);

function redisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  const placeholder = (v: string) =>
    !v || v.includes("xxx") || v.includes("AXxx") || v.includes("replace-with");
  return !placeholder(url) && !placeholder(token);
}

function createRateLimiter(memoryFallback: InMemoryRateLimiter): RateLimiter {
  // Redis-backed limits are ideal for multi-instance production, but the app
  // must stay up when Upstash creds are missing (e.g. fresh Vercel project
  // without env vars). Fall back to in-memory limits with a warning instead
  // of throwing — throwing here 500s every API route and every page that
  // imports a limiter. Skip the warning during `next build` static analysis.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build" &&
    !redisConfigured()
  ) {
    console.warn(
      "Rate limiting with in-memory fallback: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured. Set them in Vercel for shared limits across instances.",
    );
  }
  return memoryFallback;
}

export const authRateLimit = createRateLimiter(memoryAuth);
export const searchRateLimit = createRateLimiter(memorySearch);
export const inquiryRateLimit = createRateLimiter(memoryInquiry);
export const uploadRateLimit = createRateLimiter(memoryUpload);
export const reportRateLimit = createRateLimiter(memoryReport);
export const viewRateLimit = createRateLimiter(memoryView);
export const passwordChangeRateLimit = createRateLimiter(memoryPasswordChange);
export const verifyEmailRateLimit = createRateLimiter(memoryVerifyEmail);

export async function checkRateLimit(
  limiter: Ratelimit | InMemoryRateLimiter,
  identifier: string,
) {
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: Date.now() };
  }

  return limiter.limit(identifier);
}

export async function rateLimit(
  limiter: Ratelimit | InMemoryRateLimiter,
  identifier: string,
) {
  const result = await checkRateLimit(limiter, identifier);

  if (!result.success) {
    const retryAt = new Date(result.reset).toISOString();
    throw new Error(`Rate limit exceeded. Retry after ${retryAt}`);
  }

  return result;
}

export function getRateLimitIdentifier(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
