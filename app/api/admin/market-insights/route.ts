import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { getMarketInsights } from "@/lib/competitive-intelligence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const insights = await getMarketInsights();
    return apiSuccess(insights);
  } catch (error) {
    return handleApiError(error);
  }
}
