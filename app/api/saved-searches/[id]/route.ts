import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { deleteSavedSearch } from "@/lib/saved-searches";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();
    const result = await deleteSavedSearch(session.user.id, params.id);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
