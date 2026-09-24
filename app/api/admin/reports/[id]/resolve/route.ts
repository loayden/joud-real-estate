import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { resolvePropertyReport } from "@/lib/market-features";
import { reportResolveSchema } from "@/lib/validations/phase25";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = reportResolveSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid report resolution", 400, "VALIDATION_ERROR");
    }

    const report = await resolvePropertyReport({
      reportId: params.id,
      actorId: session.user.id,
      input: parsed.data,
    });

    return apiSuccess(report);
  } catch (error) {
    return handleApiError(error);
  }
}
