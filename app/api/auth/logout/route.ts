import { apiSuccess, handleApiError } from "@/lib/api-response";
import { signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    await signOut({ redirect: false });
    return apiSuccess({ signedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}
