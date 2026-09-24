import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { createPropertyReport } from "@/lib/market-features";
import { checkRateLimit, reportRateLimit } from "@/lib/rate-limit";
import { reportPropertySchema } from "@/lib/validations/phase25";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const rate = await checkRateLimit(reportRateLimit, session.user.id);

    if (!rate.success) {
      return apiError("Too many reports", 429, "RATE_LIMITED");
    }

    const parsed = reportPropertySchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid report data", 400, "VALIDATION_ERROR");
    }

    const report = await createPropertyReport(session.user.id, parsed.data);
    return apiSuccess(report, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
