import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
  rateLimit,
  viewRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const identifier = getRateLimitIdentifier(req);
    await rateLimit(viewRateLimit, `view:${identifier}`);

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!property || property.status !== "APPROVED") {
      return apiError("Property not found", 404, "NOT_FOUND");
    }

    await prisma.property.update({
      where: { id: property.id },
      data: { viewCount: { increment: 1 } },
    });

    return apiSuccess({ viewed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
