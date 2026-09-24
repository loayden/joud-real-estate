import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { getCompetitiveScore } from "@/lib/competitive-intelligence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const score = await getCompetitiveScore();
    return apiSuccess(score);
  } catch (error) {
    return handleApiError(error);
  }
}
