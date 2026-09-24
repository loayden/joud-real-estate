import { NextRequest } from "next/server";

import {
  getAdminUsers,
  parseUserRole,
  parseUserStatus,
} from "@/lib/admin-users";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const role = parseUserRole(searchParams.get("role"));
    const status = parseUserStatus(searchParams.get("status"));
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

    return apiSuccess(
      await getAdminUsers({
        search,
        role,
        status,
        page,
        limit,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
