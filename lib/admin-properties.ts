import type { Prisma, Property, PropertyStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { propertyDetailInclude } from "@/lib/property-serialization";

const propertyStatuses = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "SOLD",
  "RENTED",
  "ARCHIVED",
] as const satisfies readonly PropertyStatus[];

const adminPropertyListInclude = {
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { thumbnailUrl: true, url: true },
  },
  city: { select: { nameAr: true, nameEn: true, slug: true } },
  region: { select: { nameAr: true, nameEn: true, slug: true } },
  category: { select: { nameAr: true, nameEn: true, slug: true } },
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          preferredLocale: true,
        },
      },
    },
  },
} satisfies Prisma.PropertyInclude;

const adminPropertyDetailInclude = {
  ...propertyDetailInclude,
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          whatsapp: true,
          preferredLocale: true,
        },
      },
    },
  },
} satisfies Prisma.PropertyInclude;

type AdminPropertyListRecord = Prisma.PropertyGetPayload<{
  include: typeof adminPropertyListInclude;
}>;

type AdminPropertyDetailRecord = Prisma.PropertyGetPayload<{
  include: typeof adminPropertyDetailInclude;
}>;

function decimalToNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return typeof value === "number" ? value : Number(value);
}

function dateToIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export function parsePropertyStatus(value: string | null | undefined) {
  return propertyStatuses.find((status) => status === value);
}

export function serializeAdminPropertyListItem(
  property: AdminPropertyListRecord,
) {
  return {
    id: property.id,
    slug: property.slug,
    titleAr: property.titleAr,
    titleEn: property.titleEn,
    listingType: property.listingType,
    status: property.status,
    price: decimalToNumber(property.price),
    currency: property.currency,
    area: decimalToNumber(property.area),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    isFeatured: property.isFeatured,
    featuredUntil: dateToIso(property.featuredUntil),
    publishedAt: dateToIso(property.publishedAt),
    approvedAt: dateToIso(property.approvedAt),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
    primaryImageUrl:
      property.images[0]?.thumbnailUrl ?? property.images[0]?.url ?? null,
    city: property.city,
    region: property.region,
    category: property.category,
    owner: {
      id: property.user.id,
      email: property.user.email,
      phone: property.user.phone,
      firstName: property.user.profile?.firstName ?? null,
      lastName: property.user.profile?.lastName ?? null,
      avatarUrl: property.user.profile?.avatarUrl ?? null,
      preferredLocale: property.user.profile?.preferredLocale ?? "ar",
    },
  };
}

function serializeJson(value: Prisma.JsonValue | null) {
  if (value === null) return null;
  return JSON.parse(JSON.stringify(value)) as unknown;
}

export function serializeAdminPropertyDetail(
  property: AdminPropertyDetailRecord,
) {
  return {
    ...property,
    price: decimalToNumber(property.price),
    area: decimalToNumber(property.area),
    streetWidth:
      property.streetWidth === null
        ? null
        : decimalToNumber(property.streetWidth),
    latitude:
      property.latitude === null ? null : decimalToNumber(property.latitude),
    longitude:
      property.longitude === null ? null : decimalToNumber(property.longitude),
    amenityIds: property.amenities.map((item) => item.amenityId),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
    publishedAt: dateToIso(property.publishedAt),
    expiresAt: dateToIso(property.expiresAt),
    approvedAt: dateToIso(property.approvedAt),
    featuredUntil: dateToIso(property.featuredUntil),
    owner: {
      id: property.user.id,
      email: property.user.email,
      phone: property.user.phone,
      firstName: property.user.profile?.firstName ?? null,
      lastName: property.user.profile?.lastName ?? null,
      avatarUrl: property.user.profile?.avatarUrl ?? null,
      whatsapp: property.user.profile?.whatsapp ?? null,
      preferredLocale: property.user.profile?.preferredLocale ?? "ar",
    },
  };
}

export function snapshotPropertyForAudit(property: Property) {
  return {
    id: property.id,
    slug: property.slug,
    titleAr: property.titleAr,
    status: property.status,
    isFeatured: property.isFeatured,
    featuredUntil: dateToIso(property.featuredUntil),
    approvedAt: dateToIso(property.approvedAt),
    approvedBy: property.approvedBy,
    rejectionReason: property.rejectionReason,
    publishedAt: dateToIso(property.publishedAt),
    updatedAt: property.updatedAt.toISOString(),
  };
}

function buildWhere({
  status,
  search,
}: {
  status?: PropertyStatus;
  search?: string;
}): Prisma.PropertyWhereInput {
  const trimmedSearch = search?.trim();

  return {
    ...(status ? { status } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { titleAr: { contains: trimmedSearch, mode: "insensitive" } },
            { titleEn: { contains: trimmedSearch, mode: "insensitive" } },
            { slug: { contains: trimmedSearch, mode: "insensitive" } },
            {
              user: {
                OR: [
                  {
                    email: { contains: trimmedSearch, mode: "insensitive" },
                  },
                  {
                    phone: { contains: trimmedSearch, mode: "insensitive" },
                  },
                  {
                    profile: {
                      is: {
                        firstName: {
                          contains: trimmedSearch,
                          mode: "insensitive",
                        },
                      },
                    },
                  },
                  {
                    profile: {
                      is: {
                        lastName: {
                          contains: trimmedSearch,
                          mode: "insensitive",
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        }
      : {}),
  };
}

export async function getAdminProperties({
  status,
  search,
  page = 1,
  limit = 20,
}: {
  status?: PropertyStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const where = buildWhere({ status, search });
  const skip = (safePage - 1) * safeLimit;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
      skip,
      take: safeLimit,
      include: adminPropertyListInclude,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    data: properties.map(serializeAdminPropertyListItem),
    total,
    page: safePage,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1),
  };
}

export async function getAdminPropertyForReview(id: string) {
  const [property, auditLogs] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: adminPropertyDetailInclude,
    }),
    prisma.auditLog.findMany({
      where: { entity: "Property", entityId: id },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  if (!property) {
    return null;
  }

  return {
    property: serializeAdminPropertyDetail(property),
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      oldValues: serializeJson(log.oldValues),
      newValues: serializeJson(log.newValues),
      metadata: serializeJson(log.metadata),
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
      actor: log.actor
        ? {
            email: log.actor.email,
            firstName: log.actor.profile?.firstName ?? null,
            lastName: log.actor.profile?.lastName ?? null,
          }
        : null,
    })),
  };
}

export type AdminPropertyListItem = Awaited<
  ReturnType<typeof getAdminProperties>
>["data"][number];

export type AdminPropertyReview = NonNullable<
  Awaited<ReturnType<typeof getAdminPropertyForReview>>
>;
