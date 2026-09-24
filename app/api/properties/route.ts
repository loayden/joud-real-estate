import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { parseListingType } from "@/lib/property-listing";
import { getApprovedPropertyList } from "@/lib/public-properties";
import { serializeProperty } from "@/lib/property-serialization";
import {
  findPropertyDetailById,
  getDefaultDraftLocation,
  syncPropertyAmenities,
  validatePropertyRelations,
} from "@/lib/property-service";
import { generatePropertySlug } from "@/lib/slug";
import {
  propertyCreateSchema,
  propertySubmitSchema,
} from "@/lib/validations/property";
import { sanitizePropertyInput } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DRAFT_DESCRIPTION =
  "مسودة عقار محفوظة مؤقتاً. يرجى تحديث الوصف قبل إرسال العقار للمراجعة.";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") ?? "20"), 1),
      50,
    );
    const skip = (page - 1) * limit;

    if (searchParams.get("mine") === "true") {
      const session = await requireSession();
      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where: { userId: session.user.id },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { thumbnailUrl: true, url: true },
            },
            city: { select: { nameAr: true, nameEn: true, slug: true } },
            category: { select: { nameAr: true, nameEn: true, slug: true } },
          },
        }),
        prisma.property.count({ where: { userId: session.user.id } }),
      ]);

      return apiSuccess({
        data: properties.map((property) => ({
          ...property,
          price: property.price.toNumber(),
          area: property.area.toNumber(),
          streetWidth: property.streetWidth?.toNumber() ?? null,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    const results = await getApprovedPropertyList({
      page,
      limit,
      sort: searchParams.get("sort"),
      listingType: parseListingType(searchParams.get("listingType")),
      categoryId: searchParams.get("categoryId") ?? undefined,
      q: searchParams.get("q")?.trim(),
    });

    return apiSuccess({
      data: results.data,
      total: results.total,
      page: results.page,
      totalPages: results.totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = propertyCreateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid property data", 400, "VALIDATION_ERROR");
    }

    const sanitized = sanitizePropertyInput(parsed.data);
    const sanitizedParsed = propertyCreateSchema.safeParse(sanitized);

    if (!sanitizedParsed.success) {
      return apiError("Invalid property data", 400, "VALIDATION_ERROR");
    }

    const input = sanitizedParsed.data;
    const action = input.action ?? "draft";
    const defaultLocation = await getDefaultDraftLocation();
    const cityId = input.cityId ?? defaultLocation.id;
    const regionId = input.regionId ?? defaultLocation.regionId;

    if (action === "submit") {
      const submitInput = propertySubmitSchema.safeParse({
        ...input,
        cityId,
        regionId,
        descriptionAr: input.descriptionAr,
        price: input.price,
        area: input.area,
        areaUnit: input.areaUnit ?? "sqm",
        amenityIds: input.amenityIds ?? [],
      });

      if (!submitInput.success) {
        return apiError(
          "Property is missing required submission fields",
          400,
          "VALIDATION_ERROR",
        );
      }

      const { city } = await validatePropertyRelations(submitInput.data);
      const slug = generatePropertySlug(submitInput.data.titleAr, city.slug);
      const { amenityIds, ...propertyData } = submitInput.data;

      const created = await prisma.$transaction(async (tx) => {
        const property = await tx.property.create({
          data: {
            ...propertyData,
            userId: session.user.id,
            slug,
            status: "PENDING",
            publishedAt: new Date(),
          },
        });
        await syncPropertyAmenities(tx, property.id, amenityIds);
        await tx.propertyPriceHistory.create({
          data: {
            propertyId: property.id,
            price: property.price,
            changedBy: session.user.id,
            note: "Initial submitted price",
          },
        });
        return property;
      });

      const property = await findPropertyDetailById(created.id);

      return apiSuccess(
        {
          id: created.id,
          slug: created.slug,
          property: property ? serializeProperty(property) : null,
        },
        201,
      );
    }

    const draftInput = {
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      descriptionAr: input.descriptionAr ?? DRAFT_DESCRIPTION,
      descriptionEn: input.descriptionEn,
      listingType: input.listingType,
      categoryId: input.categoryId,
      typeId: input.typeId,
      regionId,
      cityId,
      neighborhoodId: input.neighborhoodId,
      price: input.price ?? 0,
      priceNegotiable: input.priceNegotiable ?? false,
      area: input.area ?? 0,
      areaUnit: input.areaUnit ?? "sqm",
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      floors: input.floors,
      parkingSpaces: input.parkingSpaces,
      yearBuilt: input.yearBuilt,
      streetWidth: input.streetWidth,
      address: input.address,
      street: input.street,
      buildingNumber: input.buildingNumber,
      apartmentNumber: input.apartmentNumber,
      floorNumber: input.floorNumber,
      latitude: input.latitude,
      longitude: input.longitude,
      virtualTourUrl: input.virtualTourUrl,
      tour360ImageUrls: input.tour360ImageUrls,
      amenityIds: input.amenityIds ?? [],
    };

    const { city } = await validatePropertyRelations(draftInput);
    const slug = generatePropertySlug(input.titleAr, city.slug);
    const { amenityIds, ...propertyData } = draftInput;

    const created = await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          ...propertyData,
          userId: session.user.id,
          slug,
          status: "DRAFT",
        },
      });
      await syncPropertyAmenities(tx, property.id, amenityIds);
      await tx.propertyPriceHistory.create({
        data: {
          propertyId: property.id,
          price: property.price,
          changedBy: session.user.id,
          note: "Initial draft price",
        },
      });
      return property;
    });

    const property = await findPropertyDetailById(created.id);

    return apiSuccess(
      {
        id: created.id,
        slug: created.slug,
        property: property ? serializeProperty(property) : null,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
