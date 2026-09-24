import { NextRequest } from "next/server";
import { z } from "zod";

import { changeUserRole } from "@/lib/admin-user-actions";
import { parseEditableUserRole } from "@/lib/admin-users";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const roleSchema = z.object({
  role: z.enum(["USER", "AGENT", "ADMIN"]),
});

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    const parsed = roleSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid role", 400, "VALIDATION_ERROR");
    }

    const role = parseEditableUserRole(parsed.data.role);

    if (!role) {
      return apiError("Invalid role", 400, "VALIDATION_ERROR");
    }

    const user = await changeUserRole({
      targetUserId: params.id,
      actorId: session.user.id,
      role,
      ipAddress: requestIp(req),
    });

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
