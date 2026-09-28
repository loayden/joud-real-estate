import { Redis } from "@upstash/redis";

function isPlaceholder(value: string | undefined) {
  if (!value) return true;
  const trimmed = value.trim();
  return !trimmed || trimmed.includes("xxx") || trimmed.includes("AXxx");
}

function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (isPlaceholder(url) || isPlaceholder(token)) {
    return null;
  }

  try {
    const parsed = new URL(url!);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      console.warn(
        "UPSTASH_REDIS_REST_URL has invalid protocol — Redis disabled",
      );
      return null;
    }
  } catch {
    console.warn("UPSTASH_REDIS_REST_URL is not a valid URL — Redis disabled");
    return null;
  }

  return new Redis({ url: url!, token: token! });
}

export const redis = createRedisClient();

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 86400,
): Promise<T> {
  if (!redis) {
    return fetcher();
  }

  try {
    const cached = await redis.get<T | string>(key);

    if (cached !== null) {
      if (typeof cached === "string") {
        try {
          return JSON.parse(cached) as T;
        } catch {
          return cached as T;
        }
      }

      return cached as T;
    }
  } catch (error) {
    console.warn(`Redis read failed for ${key}`, error);
  }

  const data = await fetcher();

  try {
    await redis.set(key, data, { ex: ttl });
  } catch (error) {
    console.warn(`Redis write failed for ${key}`, error);
  }

  return data;
}
