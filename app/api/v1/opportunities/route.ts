import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  searchRateLimit,
} from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(req);
    const { success } = await checkRateLimit(searchRateLimit, identifier);

    if (!success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "20", 10),
      50,
    );

    const propertiesWithDrops = await prisma.property.findMany({
      where: {
        status: "APPROVED",
        priceHistory: {
          some: {},
        },
      },
      include: {
        priceHistory: {
          orderBy: { createdAt: "desc" },
          take: 2,
        },
        city: { select: { nameAr: true, nameEn: true, slug: true } },
        region: { select: { nameAr: true, nameEn: true, slug: true } },
        category: { select: { nameAr: true, nameEn: true, slug: true } },
        type: { select: { nameAr: true, nameEn: true, slug: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, thumbnailUrl: true },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 100,
    });

    const opportunities = propertiesWithDrops
      .filter((p) => p.priceHistory.length >= 2)
      .map((p) => {
        const latest = Number(p.priceHistory[0]?.price ?? p.price);
        const previous = Number(p.priceHistory[1]?.price ?? p.price);
        const currentPrice = Number(p.price);
        const basePrice = latest || currentPrice;

        if (previous <= 0 || basePrice <= 0) return null;

        const dropPercent = Math.round(
          ((previous - basePrice) / previous) * 100,
        );
        if (dropPercent <= 0) return null;

        return {
          id: p.id,
          slug: p.slug,
          titleAr: p.titleAr,
          titleEn: p.titleEn,
          currentPrice,
          previousPrice: previous,
          dropPercent,
          currency: p.currency,
          area: Number(p.area),
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          city: p.city,
          region: p.region,
          category: p.category,
          type: p.type,
          primaryImageUrl:
            p.images[0]?.thumbnailUrl ?? p.images[0]?.url ?? null,
          publishedAt: p.publishedAt?.toISOString() ?? null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.dropPercent ?? 0) - (a?.dropPercent ?? 0))
      .slice(0, limit);

    return apiSuccess({
      total: opportunities.length,
      data: opportunities,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
