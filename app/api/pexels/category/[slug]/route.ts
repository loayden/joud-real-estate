import { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getCategoryPexelsImages } from "@/lib/pexels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const images = await getCategoryPexelsImages(params.slug);
    return apiSuccess({ images });
  } catch (error) {
    return handleApiError(error);
  }
}
