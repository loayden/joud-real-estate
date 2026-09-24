import type { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
  propertyListInclude,
  serializePropertyListItem,
} from "@/lib/property-listing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        categoryId: true,
        cityId: true,
      },
    });

    if (!property) {
      return apiError("Property not found", 404, "NOT_FOUND");
    }

    const similar = await prisma.property.findMany({
      where: {
        categoryId: property.categoryId,
        cityId: property.cityId,
        status: "APPROVED",
        NOT: { id: params.id },
      },
      include: propertyListInclude,
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      take: 6,
    });

    return apiSuccess({
      recommendations: similar.map(serializePropertyListItem),
      algorithm: "category_city_similarity_v1",
      aiEnabled: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
