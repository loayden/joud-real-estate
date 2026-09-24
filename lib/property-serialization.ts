import type { Prisma } from "@prisma/client";

export const propertyDetailInclude = {
  region: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
  city: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
  neighborhood: {
    select: { id: true, nameAr: true, nameEn: true, slug: true },
  },
  category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
  type: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
  amenities: {
    include: {
      amenity: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          category: true,
          iconName: true,
        },
      },
    },
  },
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      url: true,
      thumbnailUrl: true,
      isPrimary: true,
      sortOrder: true,
    },
  },
  user: {
    select: {
      id: true,
      phone: true,
      sellerScore: true,
      sellerRatingCount: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          whatsapp: true,
        },
      },
    },
  },
} satisfies Prisma.PropertyInclude;

export type PropertyWithDetail = Prisma.PropertyGetPayload<{
  include: typeof propertyDetailInclude;
}>;

function decimalToNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return typeof value === "number" ? value : Number(value);
}

export function serializeProperty(property: PropertyWithDetail) {
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
  };
}
