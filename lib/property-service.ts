import type { Prisma, Property } from "@prisma/client";

import { HttpError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { propertyDetailInclude } from "@/lib/property-serialization";
import { generatePropertySlug } from "@/lib/slug";
import {
  propertySubmitSchema,
  type PropertyMutationInput,
  type PropertySubmitInput,
} from "@/lib/validations/property";

type ExistingProperty = Property & {
  amenities?: Array<{ amenityId: string }>;
};

function toNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return typeof value === "number" ? value : Number(value);
}

export async function getDefaultDraftLocation() {
  const city = await prisma.city.findFirst({
    where: {
      isActive: true,
      region: { isActive: true },
    },
    orderBy: [{ region: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      regionId: true,
    },
  });

  if (!city) {
    throw new HttpError("No active city is available", 500, "NO_ACTIVE_CITY");
  }

  return city;
}

export async function validatePropertyRelations(input: {
  categoryId: string;
  typeId: string;
  regionId: string;
  cityId: string;
  neighborhoodId?: string | null;
  amenityIds?: string[];
}) {
  const [propertyType, city, neighborhood, amenityCount] = await Promise.all([
    prisma.propertyType.findFirst({
      where: {
        id: input.typeId,
        categoryId: input.categoryId,
        isActive: true,
        category: { isActive: true },
      },
      select: { id: true },
    }),
    prisma.city.findFirst({
      where: {
        id: input.cityId,
        regionId: input.regionId,
        isActive: true,
        region: { isActive: true },
      },
      select: { id: true, slug: true },
    }),
    input.neighborhoodId
      ? prisma.neighborhood.findFirst({
          where: {
            id: input.neighborhoodId,
            cityId: input.cityId,
            isActive: true,
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    input.amenityIds?.length
      ? prisma.amenity.count({ where: { id: { in: input.amenityIds } } })
      : Promise.resolve(0),
  ]);

  if (!propertyType) {
    throw new HttpError(
      "Property type does not belong to the selected category",
      400,
      "INVALID_PROPERTY_TYPE",
    );
  }

  if (!city) {
    throw new HttpError(
      "City does not belong to the selected active region",
      400,
      "INVALID_CITY",
    );
  }

  if (input.neighborhoodId && !neighborhood) {
    throw new HttpError(
      "Neighborhood does not belong to the selected city",
      400,
      "INVALID_NEIGHBORHOOD",
    );
  }

  if (input.amenityIds?.length && amenityCount !== input.amenityIds.length) {
    throw new HttpError("Invalid amenities selected", 400, "INVALID_AMENITY");
  }

  return { city };
}

export function mergePropertyForSubmit(
  property: ExistingProperty,
  input: PropertyMutationInput,
) {
  const neighborhoodId =
    input.neighborhoodId !== undefined
      ? (input.neighborhoodId ?? undefined)
      : (property.neighborhoodId ?? undefined);

  return propertySubmitSchema.parse({
    titleAr: input.titleAr ?? property.titleAr,
    titleEn: input.titleEn ?? property.titleEn ?? undefined,
    descriptionAr: input.descriptionAr ?? property.descriptionAr,
    descriptionEn: input.descriptionEn ?? property.descriptionEn ?? undefined,
    listingType: input.listingType ?? property.listingType,
    categoryId: input.categoryId ?? property.categoryId,
    typeId: input.typeId ?? property.typeId,
    regionId: input.regionId ?? property.regionId,
    cityId: input.cityId ?? property.cityId,
    neighborhoodId,
    price: input.price ?? toNumber(property.price),
    priceNegotiable: input.priceNegotiable ?? property.priceNegotiable,
    area: input.area ?? toNumber(property.area),
    areaUnit: input.areaUnit ?? property.areaUnit,
    bedrooms: input.bedrooms ?? property.bedrooms ?? undefined,
    bathrooms: input.bathrooms ?? property.bathrooms ?? undefined,
    floors: input.floors ?? property.floors ?? undefined,
    parkingSpaces: input.parkingSpaces ?? property.parkingSpaces ?? undefined,
    yearBuilt: input.yearBuilt ?? property.yearBuilt ?? undefined,
    streetWidth:
      input.streetWidth ??
      (property.streetWidth === null
        ? undefined
        : toNumber(property.streetWidth)),
    address: input.address ?? property.address ?? undefined,
    virtualTourUrl:
      input.virtualTourUrl ?? property.virtualTourUrl ?? undefined,
    tour360ImageUrls:
      input.tour360ImageUrls ??
      (property.tour360ImageUrls as string[] | null) ??
      undefined,
    amenityIds:
      input.amenityIds ??
      property.amenities?.map((item) => item.amenityId) ??
      [],
  });
}

export function toPropertyUpdateData(
  input: PropertySubmitInput | PropertyMutationInput,
): Prisma.PropertyUpdateInput {
  return {
    ...(input.titleAr !== undefined && { titleAr: input.titleAr }),
    ...(input.titleEn !== undefined && { titleEn: input.titleEn }),
    ...(input.descriptionAr !== undefined && {
      descriptionAr: input.descriptionAr,
    }),
    ...(input.descriptionEn !== undefined && {
      descriptionEn: input.descriptionEn,
    }),
    ...(input.listingType !== undefined && { listingType: input.listingType }),
    ...(input.categoryId !== undefined && {
      category: { connect: { id: input.categoryId } },
    }),
    ...(input.typeId !== undefined && {
      type: { connect: { id: input.typeId } },
    }),
    ...(input.regionId !== undefined && {
      region: { connect: { id: input.regionId } },
    }),
    ...(input.cityId !== undefined && {
      city: { connect: { id: input.cityId } },
    }),
    ...(input.neighborhoodId !== undefined && {
      neighborhood: input.neighborhoodId
        ? { connect: { id: input.neighborhoodId } }
        : { disconnect: true },
    }),
    ...(input.price !== undefined && { price: input.price }),
    ...(input.priceNegotiable !== undefined && {
      priceNegotiable: input.priceNegotiable,
    }),
    ...(input.area !== undefined && { area: input.area }),
    ...(input.areaUnit !== undefined && { areaUnit: input.areaUnit }),
    ...(input.bedrooms !== undefined && { bedrooms: input.bedrooms }),
    ...(input.bathrooms !== undefined && { bathrooms: input.bathrooms }),
    ...(input.floors !== undefined && { floors: input.floors }),
    ...(input.parkingSpaces !== undefined && {
      parkingSpaces: input.parkingSpaces,
    }),
    ...(input.yearBuilt !== undefined && { yearBuilt: input.yearBuilt }),
    ...(input.streetWidth !== undefined && { streetWidth: input.streetWidth }),
    ...(input.address !== undefined && { address: input.address }),
    ...(input.street !== undefined && { street: input.street }),
    ...(input.buildingNumber !== undefined && {
      buildingNumber: input.buildingNumber,
    }),
    ...(input.apartmentNumber !== undefined && {
      apartmentNumber: input.apartmentNumber,
    }),
    ...(input.floorNumber !== undefined && { floorNumber: input.floorNumber }),
    ...(input.latitude !== undefined && { latitude: input.latitude }),
    ...(input.longitude !== undefined && { longitude: input.longitude }),
    ...(input.virtualTourUrl !== undefined && {
      virtualTourUrl: input.virtualTourUrl,
    }),
    ...(input.tour360ImageUrls !== undefined && {
      tour360ImageUrls: input.tour360ImageUrls,
    }),
  };
}

export async function syncPropertyAmenities(
  tx: Prisma.TransactionClient,
  propertyId: string,
  amenityIds: string[],
) {
  await tx.propertyAmenity.deleteMany({ where: { propertyId } });

  if (amenityIds.length > 0) {
    await tx.propertyAmenity.createMany({
      data: amenityIds.map((amenityId) => ({ propertyId, amenityId })),
      skipDuplicates: true,
    });
  }
}

export async function findPropertyForAccess(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      amenities: { select: { amenityId: true } },
    },
  });
}

export async function findPropertyDetailById(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: propertyDetailInclude,
  });
}

export async function findPropertyDetailByIdentifier(identifier: string) {
  return prisma.property.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
    include: propertyDetailInclude,
  });
}

export async function maybeRegenerateDraftSlug({
  existing,
  input,
}: {
  existing: Pick<Property, "status" | "slug" | "titleAr" | "cityId">;
  input: PropertyMutationInput;
}) {
  if (existing.status !== "DRAFT") {
    return existing.slug;
  }

  if (!input.cityId && !input.titleAr) {
    return existing.slug;
  }

  const city = await prisma.city.findUnique({
    where: { id: input.cityId ?? existing.cityId },
    select: { slug: true },
  });

  if (!city) {
    return existing.slug;
  }

  return generatePropertySlug(input.titleAr ?? existing.titleAr, city.slug);
}
