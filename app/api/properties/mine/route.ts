import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") ?? "20"), 1),
      50,
    );
    const skip = (page - 1) * limit;

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
  } catch (error) {
    return handleApiError(error);
  }
}
