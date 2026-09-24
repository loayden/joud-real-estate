import { apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getCached } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const cities = await getCached(
      `cities:${params.slug}`,
      () =>
        prisma.city.findMany({
          where: {
            isActive: true,
            region: {
              slug: params.slug,
              isActive: true,
            },
          },
          orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            latitude: true,
            longitude: true,
          },
        }),
      86400,
    );

    return apiSuccess(cities);
  } catch (error) {
    return handleApiError(error);
  }
}
