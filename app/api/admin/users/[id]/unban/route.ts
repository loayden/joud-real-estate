import { NextRequest } from "next/server";

import { unbanUser } from "@/lib/admin-user-actions";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const user = await unbanUser({
      targetUserId: params.id,
      actorId: session.user.id,
      actorRole: session.user.role,
      ipAddress: requestIp(req),
    });

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
