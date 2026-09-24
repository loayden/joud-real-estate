import { NextRequest } from "next/server";

import { handleApiError } from "@/lib/api-response";
import {
  getPlaceholderPexelsImage,
  getPlaceholderPexelsImages,
} from "@/lib/pexels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const seed = searchParams.get("seed");

    if (format === "json") {
      const images = await getPlaceholderPexelsImages();
      return Response.json({ success: true, data: { images } });
    }

    const image = await getPlaceholderPexelsImage(seed);

    const response = await fetch(image.src, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return new Response("Image not available", { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
