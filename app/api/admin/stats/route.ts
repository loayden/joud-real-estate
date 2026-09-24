import { getAdminStats } from "@/lib/admin-stats";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    return apiSuccess(await getAdminStats());
  } catch (error) {
    return handleApiError(error);
  }
}
