import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { respondToRating, serializeRating } from "@/lib/ratings";
import { ratingResponseSchema } from "@/lib/validations/phase25";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = ratingResponseSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid response", 400, "VALIDATION_ERROR");
    }

    const rating = await respondToRating({
      ratingId: params.id,
      ownerUserId: session.user.id,
      response: parsed.data.response,
    });

    return apiSuccess(serializeRating(rating));
  } catch (error) {
    return handleApiError(error);
  }
}
