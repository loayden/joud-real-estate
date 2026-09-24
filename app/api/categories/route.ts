import { apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getCached } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await getCached(
      "categories:all",
      () =>
        prisma.propertyCategory.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            iconName: true,
            imageUrl: true,
            types: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                slug: true,
              },
            },
          },
        }),
      86400,
    );

    return apiSuccess(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
