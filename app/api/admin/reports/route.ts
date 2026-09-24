import { NextRequest } from "next/server";
import type { ReportStatus } from "@prisma/client";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { getAdminReports } from "@/lib/market-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseStatus(value: string | null): ReportStatus | undefined {
  if (
    value === "OPEN" ||
    value === "REVIEWING" ||
    value === "RESOLVED" ||
    value === "DISMISSED"
  ) {
    return value;
  }

  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { searchParams } = new URL(req.url);
    const reports = await getAdminReports(
      parseStatus(searchParams.get("status")),
    );

    return apiSuccess({ reports });
  } catch (error) {
    return handleApiError(error);
  }
}
