import { NextRequest } from "next/server";
import type { ReviewStatus } from "@prisma/client";
import { z } from "zod";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { listAdminRatings, moderateRating } from "@/lib/ratings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  ids: z
    .array(z.string().min(1).max(128))
    .min(1, "At least one rating ID is required")
    .max(50, "Cannot moderate more than 50 ratings at once"),
  action: z.enum(["approve", "reject", "flag"]),
  reason: z.string().max(2000).optional(),
});

function parseStatus(value: string | null): ReviewStatus | undefined {
  if (
    value === "PENDING" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "FLAGGED"
  ) {
    return value;
  }

  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(req.url);
    const ratings = await listAdminRatings(
      parseStatus(searchParams.get("status")),
    );

    return apiSuccess({ ratings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return apiSuccess({
        updated: 0,
        ratings: [],
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      });
    }

    const { ids, action, reason } = parsed.data;
    const uniqueIds = Array.from(new Set(ids));
    const status =
      action === "approve"
        ? "APPROVED"
        : action === "reject"
          ? "REJECTED"
          : "FLAGGED";

    const ratings = [];

    for (const id of uniqueIds) {
      ratings.push(
        await moderateRating({
          ratingId: id,
          actorId: session.user.id,
          status,
          reason,
        }),
      );
    }

    return apiSuccess({ updated: ratings.length, ratings });
  } catch (error) {
    return handleApiError(error);
  }
}
