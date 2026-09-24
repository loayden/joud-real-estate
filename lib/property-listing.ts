import type { Prisma } from "@prisma/client";

export const propertyListInclude = {
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { thumbnailUrl: true, url: true },
  },
  city: { select: { nameAr: true, nameEn: true, slug: true } },
  region: { select: { nameAr: true, nameEn: true, slug: true } },
  category: { select: { nameAr: true, nameEn: true, slug: true } },
  type: { select: { nameAr: true, nameEn: true, slug: true } },
} satisfies Prisma.PropertyInclude;

export type PropertyListRecord = Prisma.PropertyGetPayload<{
  include: typeof propertyListInclude;
}>;

export type PropertyListItem = ReturnType<typeof serializePropertyListItem>;

function decimalToNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return typeof value === "number" ? value : Number(value);
}

export function serializePropertyListItem(property: PropertyListRecord) {
  return {
    id: property.id,
    slug: property.slug,
    titleAr: property.titleAr,
    titleEn: property.titleEn,
    listingType: property.listingType,
    price: decimalToNumber(property.price),
    currency: property.currency,
    area: decimalToNumber(property.area),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    status: property.status,
    isFeatured: property.isFeatured,
    publishedAt: property.publishedAt?.toISOString() ?? null,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
    primaryImageUrl:
      property.images[0]?.thumbnailUrl ?? property.images[0]?.url ?? null,
    city: property.city,
    region: property.region,
    category: property.category,
    type: property.type,
  };
}

export function getPropertyOrderBy(sort: string | null | undefined) {
  switch (sort) {
    case "price_asc":
    case "price-asc":
      return [{ price: "asc" as const }, { publishedAt: "desc" as const }];
    case "price_desc":
    case "price-desc":
      return [{ price: "desc" as const }, { publishedAt: "desc" as const }];
    case "area_asc":
    case "area":
      return [{ area: "asc" as const }, { publishedAt: "desc" as const }];
    default:
      return [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }];
  }
}

export function parseListingType(value: string | null | undefined) {
  if (value === "SALE" || value === "RENT") {
    return value;
  }

  return undefined;
}
