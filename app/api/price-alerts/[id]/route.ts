import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { deletePriceAlert } from "@/lib/market-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();
    const result = await deletePriceAlert(params.id, session.user.id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
