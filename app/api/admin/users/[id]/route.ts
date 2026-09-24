import { NextRequest } from "next/server";

import { getAdminUserDetail } from "@/lib/admin-users";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const user = await getAdminUserDetail(params.id);

    if (!user) {
      return apiError("User not found", 404, "NOT_FOUND");
    }

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
