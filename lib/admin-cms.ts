import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const sortOrderSchema = z.coerce.number().int().min(0).max(100000).default(0);

export const regionSchema = z.object({
  nameAr: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().min(2).max(100),
  slug: slugSchema,
  code: optionalText(10),
  isActive: z.coerce.boolean().default(true),
  sortOrder: sortOrderSchema,
});

export const citySchema = z.object({
  regionId: z.string().cuid(),
  nameAr: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().min(2).max(100),
  slug: slugSchema,
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  sortOrder: sortOrderSchema,
});

export const neighborhoodSchema = z.object({
  cityId: z.string().cuid(),
  nameAr: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().min(2).max(100),
  slug: slugSchema,
  isActive: z.coerce.boolean().default(true),
});

export const categorySchema = z.object({
  nameAr: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().min(2).max(100),
  slug: slugSchema,
  iconName: optionalText(50),
  imageUrl: optionalText(500),
  isActive: z.coerce.boolean().default(true),
  sortOrder: sortOrderSchema,
});

export const propertyTypeSchema = z.object({
  categoryId: z.string().cuid(),
  nameAr: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().min(2).max(100),
  slug: slugSchema,
  isActive: z.coerce.boolean().default(true),
  sortOrder: sortOrderSchema,
});

export const amenitySchema = z.object({
  nameAr: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().min(2).max(100),
  iconName: optionalText(50),
  category: optionalText(50),
  sortOrder: sortOrderSchema,
});

function decimalToNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return value === null || value === undefined ? null : Number(value);
}

export async function clearRegionCache(regionSlug?: string | null) {
  if (!redis) return;

  await Promise.allSettled([
    redis.del("regions:all"),
    regionSlug ? redis.del(`cities:${regionSlug}`) : Promise.resolve(0),
  ]);
}

export async function clearCityCache(citySlug?: string | null) {
  if (!redis) return;

  await Promise.allSettled([
    citySlug ? redis.del(`neighborhoods:${citySlug}`) : Promise.resolve(0),
  ]);
}

export async function clearCategoryCache(categorySlug?: string | null) {
  if (!redis) return;

  await Promise.allSettled([
    redis.del("categories:all"),
    redis.del("homepage:public"),
    categorySlug
      ? redis.del(`category-types:${categorySlug}`)
      : Promise.resolve(0),
  ]);
}

export async function clearAmenityCache() {
  if (!redis) return;
  await redis.del("amenities:all");
}

export function serializeCity(city: {
  id: string;
  regionId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  latitude: unknown;
  longitude: unknown;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
  _count?: { neighborhoods?: number; properties?: number };
}) {
  return {
    id: city.id,
    regionId: city.regionId,
    nameAr: city.nameAr,
    nameEn: city.nameEn,
    slug: city.slug,
    latitude: decimalToNumber(city.latitude),
    longitude: decimalToNumber(city.longitude),
    isActive: city.isActive,
    sortOrder: city.sortOrder,
    createdAt: city.createdAt?.toISOString() ?? null,
    updatedAt: city.updatedAt?.toISOString() ?? null,
    counts: {
      neighborhoods: city._count?.neighborhoods ?? 0,
      properties: city._count?.properties ?? 0,
    },
  };
}

export async function getAdminGeography() {
  const regions = await prisma.region.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
    include: {
      cities: {
        orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
        include: {
          neighborhoods: {
            orderBy: [{ nameAr: "asc" }],
            include: { _count: { select: { properties: true } } },
          },
          _count: { select: { neighborhoods: true, properties: true } },
        },
      },
      _count: { select: { cities: true, properties: true } },
    },
  });

  return regions.map((region) => ({
    id: region.id,
    nameAr: region.nameAr,
    nameEn: region.nameEn,
    slug: region.slug,
    code: region.code,
    isActive: region.isActive,
    sortOrder: region.sortOrder,
    createdAt: region.createdAt.toISOString(),
    updatedAt: region.updatedAt.toISOString(),
    counts: {
      cities: region._count.cities,
      properties: region._count.properties,
    },
    cities: region.cities.map((city) => ({
      ...serializeCity(city),
      neighborhoods: city.neighborhoods.map((neighborhood) => ({
        id: neighborhood.id,
        cityId: neighborhood.cityId,
        nameAr: neighborhood.nameAr,
        nameEn: neighborhood.nameEn,
        slug: neighborhood.slug,
        isActive: neighborhood.isActive,
        createdAt: neighborhood.createdAt.toISOString(),
        updatedAt: neighborhood.updatedAt.toISOString(),
        counts: { properties: neighborhood._count.properties },
      })),
    })),
  }));
}

export async function getAdminClassifications() {
  const [categories, amenities] = await Promise.all([
    prisma.propertyCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
      include: {
        types: {
          orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
          include: { _count: { select: { properties: true } } },
        },
        _count: { select: { types: true, properties: true } },
      },
    }),
    prisma.amenity.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { nameAr: "asc" }],
      include: { _count: { select: { properties: true } } },
    }),
  ]);

  return {
    categories: categories.map((category) => ({
      id: category.id,
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      slug: category.slug,
      iconName: category.iconName,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      counts: {
        types: category._count.types,
        properties: category._count.properties,
      },
      types: category.types.map((type) => ({
        id: type.id,
        categoryId: type.categoryId,
        nameAr: type.nameAr,
        nameEn: type.nameEn,
        slug: type.slug,
        isActive: type.isActive,
        sortOrder: type.sortOrder,
        createdAt: type.createdAt.toISOString(),
        updatedAt: type.updatedAt.toISOString(),
        counts: { properties: type._count.properties },
      })),
    })),
    amenities: amenities.map((amenity) => ({
      id: amenity.id,
      nameAr: amenity.nameAr,
      nameEn: amenity.nameEn,
      iconName: amenity.iconName,
      category: amenity.category,
      sortOrder: amenity.sortOrder,
      counts: { properties: amenity._count.properties },
    })),
  };
}

export type AdminGeography = Awaited<ReturnType<typeof getAdminGeography>>;
export type AdminRegion = AdminGeography[number];
export type AdminCity = AdminRegion["cities"][number];
export type AdminNeighborhood = AdminCity["neighborhoods"][number];
export type AdminClassifications = Awaited<
  ReturnType<typeof getAdminClassifications>
>;
export type AdminCategory = AdminClassifications["categories"][number];
export type AdminPropertyType = AdminCategory["types"][number];
export type AdminAmenity = AdminClassifications["amenities"][number];
