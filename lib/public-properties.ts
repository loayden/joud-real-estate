import crypto from "crypto";

import type { ListingType, Prisma } from "@prisma/client";

import {
  getPropertyListCacheVersion,
  getSearchCacheVersion,
} from "@/lib/cache-bust";
import { prisma } from "@/lib/prisma";
import {
  getPropertyOrderBy,
  propertyListInclude,
  serializePropertyListItem,
} from "@/lib/property-listing";
import {
  propertyDetailInclude,
  serializeProperty,
} from "@/lib/property-serialization";
import { getCached } from "@/lib/redis";

export type PublicPropertyListParams = {
  page?: number;
  limit?: number;
  sort?: string | null;
  listingType?: ListingType;
  categoryId?: string;
  q?: string;
};

function clampPage(page: number | undefined) {
  return Math.max(Number(page ?? 1), 1);
}

function clampLimit(limit: number | undefined) {
  return Math.min(Math.max(Number(limit ?? 20), 1), 50);
}

function hashKey(value: unknown) {
  return crypto.createHash("sha1").update(JSON.stringify(value)).digest("hex");
}

function publicPropertyWhere({
  categoryId,
  listingType,
  q,
}: PublicPropertyListParams): Prisma.PropertyWhereInput {
  const query = q?.trim();

  return {
    status: "APPROVED",
    ...(listingType ? { listingType } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(query
      ? {
          OR: [
            { titleAr: { contains: query, mode: "insensitive" } },
            { titleEn: { contains: query, mode: "insensitive" } },
            { descriptionAr: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function getApprovedPropertyList(
  params: PublicPropertyListParams,
) {
  const page = clampPage(params.page);
  const limit = clampLimit(params.limit);
  const version = await getPropertyListCacheVersion();
  const cacheKey = `properties:list:v${version}:${hashKey({
    ...params,
    page,
    limit,
    q: params.q?.trim() ?? "",
    sort: params.sort ?? "newest",
  })}`;

  return getCached(
    cacheKey,
    async () => {
      const where = publicPropertyWhere(params);
      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          orderBy: getPropertyOrderBy(params.sort),
          skip: (page - 1) * limit,
          take: limit,
          include: propertyListInclude,
        }),
        prisma.property.count({ where }),
      ]);

      return {
        data: properties.map(serializePropertyListItem),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    },
    300,
  );
}

export async function getCachedPublicPropertyBySlug(slug: string) {
  return getCached(
    `property:${slug}`,
    async () => {
      const property = await prisma.property.findFirst({
        where: { slug, status: "APPROVED" },
        include: propertyDetailInclude,
      });

      return property ? serializeProperty(property) : null;
    },
    3600,
  );
}

export async function getCachedSimilarProperties({
  categoryId,
  cityId,
  propertyId,
}: {
  categoryId: string;
  cityId: string;
  propertyId: string;
}) {
  return getCached(
    `property:similar:${propertyId}`,
    async () => {
      const properties = await prisma.property.findMany({
        where: {
          categoryId,
          cityId,
          status: "APPROVED",
          NOT: { id: propertyId },
        },
        include: propertyListInclude,
        orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
        take: 4,
      });

      return properties.map(serializePropertyListItem);
    },
    3600,
  );
}

export async function publicSearchCacheKey(params: unknown) {
  const version = await getSearchCacheVersion();
  return `search:v${version}:${hashKey(params)}`;
}
