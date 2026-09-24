import { revalidatePath, revalidateTag } from "next/cache";

import { redis } from "@/lib/redis";

const PROPERTY_LIST_VERSION_KEY = "properties:list:version";
const SEARCH_VERSION_KEY = "properties:search:version";
const ANALYTICS_VERSION_KEY = "admin:analytics:version";

async function getVersion(key: string) {
  if (!redis) return "0";

  try {
    const value = await redis.get<string | number>(key);
    return String(value ?? "0");
  } catch (error) {
    console.warn(`Redis version read failed for ${key}`, error);
    return "0";
  }
}

async function bumpVersion(key: string) {
  if (!redis) return;

  try {
    await redis.incr(key);
  } catch (error) {
    console.warn(`Redis version bump failed for ${key}`, error);
  }
}

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag);
  } catch (error) {
    console.warn(`Revalidate tag failed for ${tag}`, error);
  }
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    console.warn(`Revalidate path failed for ${path}`, error);
  }
}

export async function getPropertyListCacheVersion() {
  return getVersion(PROPERTY_LIST_VERSION_KEY);
}

export async function getSearchCacheVersion() {
  return getVersion(SEARCH_VERSION_KEY);
}

export async function getAnalyticsCacheVersion() {
  return getVersion(ANALYTICS_VERSION_KEY);
}

export async function bustPropertyCache({
  propertyId,
  slug,
}: {
  propertyId?: string | null;
  slug?: string | null;
}) {
  await Promise.all([
    bumpVersion(PROPERTY_LIST_VERSION_KEY),
    bumpVersion(SEARCH_VERSION_KEY),
    bumpVersion(ANALYTICS_VERSION_KEY),
  ]);

  if (redis) {
    await Promise.allSettled([
      redis.del("featured_properties"),
      redis.del("homepage:public"),
      redis.del("admin:analytics:properties-by-status"),
      redis.del("admin:analytics:properties-by-region"),
      slug ? redis.del(`property:${slug}`) : Promise.resolve(0),
      propertyId
        ? redis.del(`property:similar:${propertyId}`)
        : Promise.resolve(0),
    ]);
  }

  safeRevalidateTag("properties");
  safeRevalidateTag("featured-properties");
  safeRevalidateTag("admin-analytics");

  if (slug) {
    safeRevalidateTag(`property-${slug}`);
    safeRevalidatePath(`/ar/property/${slug}`);
    safeRevalidatePath(`/en/property/${slug}`);
  }

  safeRevalidatePath("/ar");
  safeRevalidatePath("/en");
  safeRevalidatePath("/ar/properties");
  safeRevalidatePath("/en/properties");
}
