import type { NextRequest } from "next/server";

import { apiSuccess, handleApiError, HttpError } from "@/lib/api-response";
import { requireV1Auth } from "@/lib/auth-v1";
import { prisma } from "@/lib/prisma";
import { parseListingType } from "@/lib/property-listing";
import { getApprovedPropertyList } from "@/lib/public-properties";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") ?? "20"), 1),
      50,
    );

    if (searchParams.get("mine") === "true") {
      const user = await requireV1Auth(req);
      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * limit,
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
        prisma.property.count({ where: { userId: user.id } }),
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
        totalPages: Math.max(1, Math.ceil(total / limit)),
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

    return apiSuccess(results);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  return handleApiError(
    new HttpError(
      "Use the web /api/properties endpoint for listing creation until mobile write contracts are finalized.",
      501,
      "NOT_IMPLEMENTED",
    ),
  );
}
