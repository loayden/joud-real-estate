import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { submitPropertyRating } from "@/lib/ratings";
import { ratingSubmitSchema } from "@/lib/validations/phase25";
import {
  rateLimit,
  inquiryRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(req);
    await rateLimit(inquiryRateLimit, `rating:${identifier}`);

    const session = await requireSession();
    const body = await req.json();
    const parsed = ratingSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid rating data", 400, "VALIDATION_ERROR");
    }

    const rating = await submitPropertyRating(session.user.id, parsed.data);
    return apiSuccess(rating, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
