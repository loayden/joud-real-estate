import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { getAdminInquiries, parseInquiryStatus } from "@/lib/inquiries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const searchParams = new URL(req.url).searchParams;
    const status = parseInquiryStatus(searchParams.get("status"));
    const search = searchParams.get("search")?.trim() ?? "";
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

    const results = await getAdminInquiries({
      status,
      search,
      page: Number.isFinite(page) ? page : 1,
      limit,
    });

    return apiSuccess(results);
  } catch (error) {
    return handleApiError(error);
  }
}
