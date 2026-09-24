import type { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import { requireCronSecret } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    requireCronSecret(req);

    const now = new Date();
    const result = await prisma.property.updateMany({
      where: {
        expiresAt: { lt: now },
        status: "APPROVED",
      },
      data: {
        status: "EXPIRED",
      },
    });

    if (result.count > 0) {
      await logAudit({
        action: "EXPIRE_LISTINGS_CRON",
        entity: "Property",
        metadata: {
          expiredCount: result.count,
          executedAt: now.toISOString(),
        },
      });
    }

    return apiSuccess({
      expiredCount: result.count,
      executedAt: now.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
