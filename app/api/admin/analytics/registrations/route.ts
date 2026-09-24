import type { NextRequest } from "next/server";

import { getRegistrationSeries } from "@/lib/admin-analytics";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const searchParams = req.nextUrl.searchParams;
    const series = await getRegistrationSeries({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    return apiSuccess(series);
  } catch (error) {
    return handleApiError(error);
  }
}
