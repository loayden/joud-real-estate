import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { getComparisonProperties } from "@/lib/market-features";
import { compareIdsSchema } from "@/lib/validations/phase25";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = compareIdsSchema.safeParse({
      ids: searchParams.get("ids") ?? "",
    });

    if (!parsed.success) {
      return apiError("Invalid comparison ids", 400, "VALIDATION_ERROR");
    }

    const properties = await getComparisonProperties(parsed.data.ids);
    return apiSuccess({ properties });
  } catch (error) {
    return handleApiError(error);
  }
}
