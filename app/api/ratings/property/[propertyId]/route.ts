import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getApprovedPropertyRatings } from "@/lib/ratings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ propertyId: string }> },
) {
  const params = await paramsPromise;
  try {
    const data = await getApprovedPropertyRatings(params.propertyId);
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
