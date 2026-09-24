import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { voteRatingHelpful } from "@/lib/ratings";
import { helpfulVoteSchema } from "@/lib/validations/phase25";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = helpfulVoteSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid vote", 400, "VALIDATION_ERROR");
    }

    const vote = await voteRatingHelpful({
      ratingId: params.id,
      userId: session.user.id,
      isHelpful: parsed.data.isHelpful,
    });

    return apiSuccess(vote);
  } catch (error) {
    return handleApiError(error);
  }
}
