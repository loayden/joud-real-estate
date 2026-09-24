import { NextRequest } from "next/server";
import { z } from "zod";

import { rejectProperty } from "@/lib/admin-property-actions";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rejectSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
});

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = rejectSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError(
        "Rejection reason must be at least 10 characters",
        400,
        "VALIDATION_ERROR",
      );
    }

    const property = await rejectProperty({
      propertyId: params.id,
      actorId: session.user.id,
      reason: parsed.data.reason,
      ipAddress: requestIp(req),
    });

    return apiSuccess(property);
  } catch (error) {
    return handleApiError(error);
  }
}
