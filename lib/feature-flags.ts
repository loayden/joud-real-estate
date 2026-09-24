import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const FEATURE_FLAG_TTL_SECONDS = 300;

export function normalizeFeatureFlagKey(key: string) {
  return key
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
}

export function featureFlagCacheKey(key: string) {
  return `flag:${normalizeFeatureFlagKey(key)}`;
}

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const normalizedKey = normalizeFeatureFlagKey(key);
  const cacheKey = featureFlagCacheKey(normalizedKey);

  if (redis) {
    try {
      const cached = await redis.get<boolean | string>(cacheKey);

      if (cached !== null) {
        return cached === true || cached === "true";
      }
    } catch (error) {
      console.warn(
        `Feature flag cache read failed for ${normalizedKey}`,
        error,
      );
    }
  }

  const flag = await prisma.featureFlag.findUnique({
    where: { key: normalizedKey },
    select: { isEnabled: true },
  });
  const enabled = flag?.isEnabled ?? false;

  if (redis) {
    try {
      await redis.set(cacheKey, enabled, { ex: FEATURE_FLAG_TTL_SECONDS });
    } catch (error) {
      console.warn(
        `Feature flag cache write failed for ${normalizedKey}`,
        error,
      );
    }
  }

  return enabled;
}

export async function bustFeatureFlagCache(key: string) {
  if (!redis) return;

  try {
    await redis.del(featureFlagCacheKey(key));
  } catch (error) {
    console.warn(`Feature flag cache bust failed for ${key}`, error);
  }
}
