import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getSellerRatings } from "@/lib/ratings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ userId: string }> },
) {
  const params = await paramsPromise;
  try {
    const data = await getSellerRatings(params.userId);
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
