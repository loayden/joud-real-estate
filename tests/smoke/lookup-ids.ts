import type { APIRequestContext } from "@playwright/test";

export type LookupIds = {
  categoryId: string;
  typeId: string;
  regionId: string;
  cityId: string;
  cityId2: string;
};

type Named = { id: string; slug: string; types?: Named[] };

async function getJson(request: APIRequestContext, url: string) {
  const res = await request.get(url);
  if (!res.ok()) {
    throw new Error(`lookup failed: ${url} -> ${res.status()}`);
  }
  const body = await res.json();
  return (body.data ?? body) as Named[];
}

/**
 * Resolve category/type/region/city IDs dynamically by slug instead of
 * hardcoding cuids. Seed data regenerates IDs on every fresh database,
 * so hardcoded IDs only ever match one developer's local DB.
 */
export async function resolveLookupIds(
  request: APIRequestContext,
  base: string,
): Promise<LookupIds> {
  const categories = await getJson(request, `${base}/api/categories`);
  const category =
    categories.find((item) => (item.types?.length ?? 0) > 0) ?? categories[0];
  if (!category?.types?.length) {
    throw new Error("lookup failed: no category with types");
  }

  const regions = await getJson(request, `${base}/api/regions`);
  const region = regions.find((item) => item.slug === "cairo") ?? regions[0];
  if (!region) {
    throw new Error("lookup failed: no regions");
  }

  const cities = await getJson(
    request,
    `${base}/api/regions/${region.slug}/cities`,
  );
  const city = cities.find((item) => item.slug === "heliopolis") ?? cities[0];
  const city2 =
    cities.find((item) => item.id !== city?.id) ?? cities[1] ?? cities[0];
  if (!city || !city2) {
    throw new Error("lookup failed: no cities");
  }

  return {
    categoryId: category.id,
    typeId: category.types[0].id,
    regionId: region.id,
    cityId: city.id,
    cityId2: city2.id,
  };
}

/**
 * Return the ID of any live (approved) listing, for favorite / inquiry /
 * report flows that require a non-draft property. Never hardcode a cuid:
 * seed data regenerates IDs on every fresh database.
 */
export async function resolveApprovedListingId(
  request: APIRequestContext,
  base: string,
): Promise<string> {
  const res = await request.get(`${base}/api/properties/search?limit=1`);
  if (!res.ok()) {
    throw new Error(`approved listing lookup failed: ${res.status()}`);
  }
  const body = await res.json();
  const id = body?.data?.data?.[0]?.id;
  if (typeof id !== "string" || !id) {
    throw new Error("approved listing lookup failed: no live listings");
  }
  return id;
}
