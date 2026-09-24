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
    const types = await getCached(
      `category-types:${params.slug}`,
      () =>
        prisma.propertyType.findMany({
          where: {
            isActive: true,
            category: {
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
          },
        }),
      86400,
    );

    return apiSuccess(types);
  } catch (error) {
    return handleApiError(error);
  }
}
