import type { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { isFeatureEnabled, normalizeFeatureFlagKey } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ key: string }> },
) {
  const params = await paramsPromise;
  try {
    const key = normalizeFeatureFlagKey(params.key);
    const enabled = await isFeatureEnabled(key);

    return apiSuccess({ key, enabled });
  } catch (error) {
    return handleApiError(error);
  }
}
