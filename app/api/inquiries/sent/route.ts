import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { getSentInquiries } from "@/lib/inquiries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();
    const inquiries = await getSentInquiries(session.user.id);

    return apiSuccess(inquiries);
  } catch (error) {
    return handleApiError(error);
  }
}
