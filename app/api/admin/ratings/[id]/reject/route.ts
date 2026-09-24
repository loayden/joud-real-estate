import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { moderateRating } from "@/lib/ratings";
import { ratingRejectSchema } from "@/lib/validations/phase25";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = ratingRejectSchema.safeParse(
      await req.json().catch(() => ({})),
    );

    if (!parsed.success) {
      return apiError("Invalid rejection reason", 400, "VALIDATION_ERROR");
    }

    const rating = await moderateRating({
      ratingId: params.id,
      actorId: session.user.id,
      status: "REJECTED",
      reason: parsed.data.reason,
    });

    return apiSuccess(rating);
  } catch (error) {
    return handleApiError(error);
  }
}
