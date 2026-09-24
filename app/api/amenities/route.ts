import { apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getCached } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const amenities = await getCached(
      "amenities:all",
      () =>
        prisma.amenity.findMany({
          orderBy: [
            { category: "asc" },
            { sortOrder: "asc" },
            { nameAr: "asc" },
          ],
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            iconName: true,
            category: true,
            sortOrder: true,
          },
        }),
      86400,
    );

    return apiSuccess(amenities);
  } catch (error) {
    return handleApiError(error);
  }
}
