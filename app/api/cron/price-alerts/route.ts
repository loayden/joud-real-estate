import type { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireCronSecret } from "@/lib/cron-auth";
import { checkPriceAlerts } from "@/lib/market-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    requireCronSecret(req);

    const result = await checkPriceAlerts();
    return apiSuccess({
      ...result,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
