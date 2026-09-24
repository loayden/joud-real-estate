import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import {
  createSavedSearch,
  getUserSavedSearches,
  savedSearchCreateSchema,
} from "@/lib/saved-searches";
import { sanitizePlainText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();
    const searches = await getUserSavedSearches(session.user.id);

    return apiSuccess(searches);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const parsed = savedSearchCreateSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid saved search data", 400, "VALIDATION_ERROR");
    }

    const sanitized = {
      ...parsed.data,
      nameAr: sanitizePlainText(parsed.data.nameAr),
    };
    const sanitizedParsed = savedSearchCreateSchema.safeParse(sanitized);

    if (!sanitizedParsed.success) {
      return apiError("Invalid saved search data", 400, "VALIDATION_ERROR");
    }

    const search = await createSavedSearch(
      session.user.id,
      sanitizedParsed.data,
    );

    return apiSuccess(search, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
