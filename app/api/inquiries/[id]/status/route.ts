import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { inquiryStatusSchema, updateInquiryStatus } from "@/lib/inquiries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();
    const parsed = inquiryStatusSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid inquiry status", 400, "VALIDATION_ERROR");
    }

    const inquiry = await updateInquiryStatus({
      inquiryId: params.id,
      userId: session.user.id,
      status: parsed.data.status,
    });

    return apiSuccess(inquiry);
  } catch (error) {
    return handleApiError(error);
  }
}
