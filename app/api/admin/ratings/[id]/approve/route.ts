import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { moderateRating } from "@/lib/ratings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const rating = await moderateRating({
      ratingId: params.id,
      actorId: session.user.id,
      status: "APPROVED",
    });

    return apiSuccess(rating);
  } catch (error) {
    return handleApiError(error);
  }
}
