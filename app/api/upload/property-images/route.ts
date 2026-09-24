import { createId } from "@paralleldrive/cuid2";
import { NextRequest } from "next/server";
import sharp from "sharp";

import {
  apiError,
  apiSuccess,
  handleApiError,
  HttpError,
} from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { bustPropertyCache } from "@/lib/cache-bust";
import { prisma } from "@/lib/prisma";
import {
  requirePropertyImageAccess,
  serializePropertyImage,
} from "@/lib/property-image-service";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  uploadRateLimit,
} from "@/lib/rate-limit";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_MEDIA_PER_PROPERTY = 20;

type MediaType = "image" | "video";
type DetectedMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/heic"
  | "video/mp4"
  | "video/webm"
  | "video/quicktime";
type PreparedUpload = {
  buffer: Buffer;
  mime: DetectedMediaType;
  name: string;
  mediaType: MediaType;
};

const VIDEO_MIMES: DetectedMediaType[] = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

function detectMediaMime(buffer: Buffer): DetectedMediaType | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  const brand = buffer.subarray(4, 12).toString("ascii");
  if (/ftyp(heic|heix|hevc|hevx|mif1|msf1)/.test(brand)) {
    return "image/heic";
  }

  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const ftypBrand = buffer.subarray(8, 16).toString("ascii");
    if (/isom|iso2|avc1|mp41|mp42|MSNV/.test(ftypBrand)) {
      return "video/mp4";
    }
  }

  if (buffer.subarray(0, 4).toString("ascii") === "\x1aE\xdf\xa3") {
    return "video/webm";
  }

  if (buffer.subarray(4, 12).toString("ascii") === "moov") {
    return "video/quicktime";
  }

  return null;
}

function getMediaType(mime: DetectedMediaType): MediaType {
  return VIDEO_MIMES.includes(mime) ? "video" : "image";
}

function getUploadFiles(formData: FormData) {
  const collected = new Map<string, File>();

  for (const item of formData.getAll("files")) {
    if (item instanceof File) {
      collected.set(`${item.name}-${item.size}-${collected.size}`, item);
    }
  }

  for (const [key, value] of formData.entries()) {
    if (
      (key.startsWith("file_") || key === "files[]") &&
      value instanceof File
    ) {
      collected.set(`${key}-${value.name}-${value.size}`, value);
    }
  }

  return Array.from(collected.values());
}

async function processImage(buffer: Buffer) {
  const orig = await Promise.race([
    sharp(buffer)
      .rotate()
      .resize(1920, 1080, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Image processing timeout")), 30000),
    ),
  ]);

  const thumb = await Promise.race([
    sharp(buffer)
      .rotate()
      .resize(400, 300, { fit: "cover" })
      .webp({ quality: 75 })
      .toBuffer(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Thumbnail processing timeout")),
        10000,
      ),
    ),
  ]);

  const metadata = await sharp(orig).metadata();

  return {
    orig,
    thumb,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}

async function generateVideoThumbnail(buffer: Buffer) {
  try {
    return await Promise.race([
      sharp(buffer)
        .rotate()
        .resize(400, 300, { fit: "cover" })
        .webp({ quality: 75 })
        .toBuffer(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Video thumbnail timeout")), 15000),
      ),
    ]);
  } catch {
    const placeholder = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#e5e7eb" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="24">Video</text></svg>',
    );
    return sharp(placeholder).webp({ quality: 75 }).toBuffer();
  }
}

async function prepareFiles(files: File[]): Promise<PreparedUpload[]> {
  const preparedFiles: PreparedUpload[] = [];

  for (const file of files) {
    const maxSize = file.type.startsWith("video/")
      ? MAX_VIDEO_SIZE
      : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      throw new HttpError(
        file.type.startsWith("video/")
          ? "Video exceeds 100MB"
          : "Image exceeds 10MB",
        400,
        "FILE_TOO_LARGE",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectMediaMime(buffer);

    if (!detectedMime) {
      throw new HttpError(
        "Unsupported file type",
        400,
        "UNSUPPORTED_FILE_TYPE",
      );
    }

    preparedFiles.push({
      buffer,
      mime: detectedMime,
      name: file.name,
      mediaType: getMediaType(detectedMime),
    });
  }

  return preparedFiles;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const limit = await checkRateLimit(
      uploadRateLimit,
      `property-images:${session.user.id}:${getRateLimitIdentifier(req)}`,
    );

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const formData = await req.formData();
    const propertyId = formData.get("propertyId");

    if (typeof propertyId !== "string" || propertyId.length === 0) {
      return apiError("propertyId is required", 400, "PROPERTY_ID_REQUIRED");
    }

    const property = await requirePropertyImageAccess({
      propertyId,
      role: session.user.role,
      userId: session.user.id,
    });

    const files = getUploadFiles(formData);

    if (files.length === 0) {
      return apiError("No image files provided", 400, "NO_FILES");
    }

    const [existingCount, existingPrimary] = await Promise.all([
      prisma.propertyImage.count({ where: { propertyId } }),
      prisma.propertyImage.findFirst({
        where: { propertyId, isPrimary: true },
        select: { id: true },
      }),
    ]);

    if (existingCount + files.length > MAX_MEDIA_PER_PROPERTY) {
      return apiError(
        `A property can have at most ${MAX_MEDIA_PER_PROPERTY} media items`,
        400,
        "MEDIA_LIMIT_EXCEEDED",
      );
    }

    const preparedFiles = await prepareFiles(files);
    const createdImages = [];

    for (const [index, file] of preparedFiles.entries()) {
      const mediaKeyId = createId();
      let origKey: string;
      let thumbKey: string;
      let processed: Awaited<ReturnType<typeof processImage>> | null = null;
      let thumbnailBuffer: Buffer;

      if (file.mediaType === "video") {
        origKey = `properties/${propertyId}/${mediaKeyId}_orig${file.name.slice(file.name.lastIndexOf("."))}`;
        thumbKey = `properties/${propertyId}/${mediaKeyId}_thumb.webp`;

        try {
          thumbnailBuffer = await generateVideoThumbnail(file.buffer);
        } catch {
          const placeholder = Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#e5e7eb" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="24">Video</text></svg>',
          );
          thumbnailBuffer = await sharp(placeholder)
            .webp({ quality: 75 })
            .toBuffer();
        }

        const [url, thumbnailUrl] = await Promise.all([
          uploadToR2(origKey, file.buffer, file.mime),
          uploadToR2(thumbKey, thumbnailBuffer, "image/webp"),
        ]);

        const image = await prisma.propertyImage.create({
          data: {
            propertyId,
            storageKey: origKey,
            url,
            thumbnailKey: thumbKey,
            thumbnailUrl,
            width: null,
            height: null,
            sizeBytes: file.buffer.length,
            sortOrder: existingCount + index,
            isPrimary: !existingPrimary && existingCount === 0 && index === 0,
            mediaType: "video",
          },
        });

        createdImages.push(serializePropertyImage(image));
      } else {
        origKey = `properties/${propertyId}/${mediaKeyId}_orig.webp`;
        thumbKey = `properties/${propertyId}/${mediaKeyId}_thumb.webp`;

        try {
          processed = await processImage(file.buffer);
        } catch {
          throw new HttpError(
            `Could not process image: ${file.name}`,
            400,
            "IMAGE_PROCESSING_FAILED",
          );
        }

        const [url, thumbnailUrl] = await Promise.all([
          uploadToR2(origKey, processed.orig, "image/webp"),
          uploadToR2(thumbKey, processed.thumb, "image/webp"),
        ]);

        const image = await prisma.propertyImage.create({
          data: {
            propertyId,
            storageKey: origKey,
            url,
            thumbnailKey: thumbKey,
            thumbnailUrl,
            width: processed.width,
            height: processed.height,
            sizeBytes: processed.orig.length,
            sortOrder: existingCount + index,
            isPrimary: !existingPrimary && existingCount === 0 && index === 0,
            mediaType: "image",
          },
        });

        createdImages.push(serializePropertyImage(image));
      }
    }

    if (property.status === "APPROVED") {
      await bustPropertyCache({ propertyId: property.id, slug: property.slug });
    }

    return apiSuccess(createdImages, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
