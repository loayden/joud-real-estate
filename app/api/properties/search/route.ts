import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { publicSearchCacheKey } from "@/lib/public-properties";
import { normalizeSearchParams, searchProperties } from "@/lib/property-search";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  searchRateLimit,
} from "@/lib/rate-limit";
import { getCached } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(req);
    const { success } = await checkRateLimit(searchRateLimit, identifier);

    if (!success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const params = normalizeSearchParams(
      Object.fromEntries(new URL(req.url).searchParams.entries()),
    );

    if (!params) {
      return apiError("Invalid search filters", 400, "VALIDATION_ERROR");
    }

    const results = await getCached(
      await publicSearchCacheKey(params),
      () => searchProperties(params),
      300,
    );

    return apiSuccess(results);
  } catch (error) {
    return handleApiError(error);
  }
}
