import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { getUserFavorites, toggleFavorite } from "@/lib/favorites";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const favoriteToggleSchema = z.object({
  propertyId: z.string().cuid(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const favorites = await getUserFavorites(session.user.id);

    return apiSuccess(favorites);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const parsed = favoriteToggleSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid favorite data", 400, "VALIDATION_ERROR");
    }

    const result = await toggleFavorite(
      session.user.id,
      parsed.data.propertyId,
    );

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
