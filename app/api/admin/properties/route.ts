import { NextRequest } from "next/server";

import {
  getAdminProperties,
  parsePropertyStatus,
} from "@/lib/admin-properties";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const status = parsePropertyStatus(searchParams.get("status"));
    const search = searchParams.get("search") ?? undefined;

    return apiSuccess(
      await getAdminProperties({
        status,
        search,
        page,
        limit,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
