import { NextRequest } from "next/server";
import { z } from "zod";

import { banUser } from "@/lib/admin-user-actions";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const banSchema = z
  .object({
    reason: z.string().trim().max(1000).optional(),
  })
  .optional();

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const body = await req.json().catch(() => undefined);
    const parsed = banSchema.safeParse(body);
    const user = await banUser({
      targetUserId: params.id,
      actorId: session.user.id,
      actorRole: session.user.role,
      reason: parsed.success ? parsed.data?.reason : undefined,
      ipAddress: requestIp(req),
    });

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
