import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getPriceHistory } from "@/lib/market-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  const params = await paramsPromise;
  try {
    const history = await getPriceHistory(params.id);
    return apiSuccess({ history });
  } catch (error) {
    return handleApiError(error);
  }
}
