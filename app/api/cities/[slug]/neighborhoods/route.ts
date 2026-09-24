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
    const neighborhoods = await getCached(
      `neighborhoods:${params.slug}`,
      () =>
        prisma.neighborhood.findMany({
          where: {
            isActive: true,
            city: {
              slug: params.slug,
              isActive: true,
              region: { isActive: true },
            },
          },
          orderBy: [{ nameAr: "asc" }],
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
          },
        }),
      86400,
    );

    return apiSuccess(neighborhoods);
  } catch (error) {
    return handleApiError(error);
  }
}
