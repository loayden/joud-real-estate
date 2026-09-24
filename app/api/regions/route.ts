import { apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getCached } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const regions = await getCached(
      "regions:all",
      () =>
        prisma.region.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            code: true,
          },
        }),
      86400,
    );

    return apiSuccess(regions);
  } catch (error) {
    return handleApiError(error);
  }
}
