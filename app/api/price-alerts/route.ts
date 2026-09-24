import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { getUserPriceAlerts, upsertPriceAlert } from "@/lib/market-features";
import { priceAlertSchema } from "@/lib/validations/phase25";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();
    const alerts = await getUserPriceAlerts(session.user.id);
    return apiSuccess({ alerts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const parsed = priceAlertSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid price alert", 400, "VALIDATION_ERROR");
    }

    const alert = await upsertPriceAlert(session.user.id, parsed.data);
    return apiSuccess(alert, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
