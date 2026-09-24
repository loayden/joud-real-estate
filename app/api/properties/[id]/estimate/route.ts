import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getPropertyEstimate } from "@/lib/market-features";
import {
  rateLimit,
  searchRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const identifier = getRateLimitIdentifier(req);
    await rateLimit(searchRateLimit, `estimate:${identifier}`);

    const estimate = await getPropertyEstimate(params.id);
    return apiSuccess(estimate);
  } catch (error) {
    return handleApiError(error);
  }
}
