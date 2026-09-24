import { Redis } from "@upstash/redis";

function isPlaceholder(value: string | undefined) {
  return !value || value.includes("xxx") || value.includes("AXxx");
}

function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (isPlaceholder(url) || isPlaceholder(token)) {
    return null;
  }

  return new Redis({ url, token });
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
