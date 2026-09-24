import { NextRequest } from "next/server";
import sharp from "sharp";

import { handleApiError } from "@/lib/api-response";
import {
  getPlaceholderPexelsImage,
  getPlaceholderPexelsImages,
} from "@/lib/pexels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return ab;
}

const MAX_PLACEHOLDER_WIDTH = 1200;
const FETCH_TIMEOUT_MS = 10000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const seed = searchParams.get("seed");

    if (format === "json") {
      const images = await getPlaceholderPexelsImages();
      return Response.json({ success: true, data: { images } });
    }

    const width = Math.min(
      Math.max(Number(searchParams.get("w")) || MAX_PLACEHOLDER_WIDTH, 16),
      MAX_PLACEHOLDER_WIDTH,
    );

    const image = await getPlaceholderPexelsImage(seed);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(image.src, {
        next: { revalidate: 86400 },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return new Response("Image not available", { status: 502 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    let output: Buffer;
    try {
      output = await Promise.race([
        sharp(buffer)
          .rotate()
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Placeholder resize timeout")),
            15000,
          ),
        ),
      ]);
    } catch {
      // If Sharp can't process the source, proxy it untouched.
      return new Response(toArrayBuffer(buffer), {
        headers: {
          "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }

    return new Response(toArrayBuffer(output), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
