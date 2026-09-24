import { apiSuccess, handleApiError } from "@/lib/api-response";
import { getHeroPexelsImages } from "@/lib/pexels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const images = await getHeroPexelsImages();
    return apiSuccess({ images });
  } catch (error) {
    return handleApiError(error);
  }
}
