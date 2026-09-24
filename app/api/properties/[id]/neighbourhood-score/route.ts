import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getNeighbourhoodScore } from "@/lib/market-features";
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
    await rateLimit(searchRateLimit, `neighbourhood:${identifier}`);

    const score = await getNeighbourhoodScore(params.id);
    return apiSuccess(score);
  } catch (error) {
    return handleApiError(error);
  }
}
