import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getPriceHistory } from "@/lib/market-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const history = await getPriceHistory(params.id);
    return apiSuccess({ history });
  } catch (error) {
    return handleApiError(error);
  }
}
