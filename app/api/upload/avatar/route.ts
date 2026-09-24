import crypto from "crypto";

import sharp from "sharp";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  uploadRateLimit,
} from "@/lib/rate-limit";
import { deleteFromR2, uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasValidImageSignature(buffer: Buffer) {
  const jpeg = buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const png = buffer
    .subarray(0, 4)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const webp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  return jpeg || png || webp;
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const limit = await checkRateLimit(
      uploadRateLimit,
      `avatar:${session.user.id}:${getRateLimitIdentifier(req)}`,
    );

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("Avatar file is required", 400, "FILE_REQUIRED");
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return apiError("Unsupported image type", 400, "UNSUPPORTED_IMAGE_TYPE");
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return apiError(
        "Avatar image must be 2MB or smaller",
        400,
        "FILE_TOO_LARGE",
      );
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    if (!hasValidImageSignature(originalBuffer)) {
      return apiError("Invalid image file", 400, "INVALID_IMAGE");
    }

    const processedBuffer = await sharp(originalBuffer, {
      failOn: "error",
      limitInputPixels: 16_000_000,
    })
      .rotate()
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();

    const currentProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        avatarKey: true,
        firstName: true,
        lastName: true,
        preferredLocale: true,
      },
    });

    const key = `avatars/${session.user.id}/avatar_${crypto.randomUUID()}.webp`;
    const url = await uploadToR2(key, processedBuffer, "image/webp");

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        avatarKey: key,
        avatarUrl: url,
      },
      create: {
        userId: session.user.id,
        firstName: session.user.name ?? "User",
        lastName: "",
        preferredLocale: "ar",
        avatarKey: key,
        avatarUrl: url,
      },
      select: {
        avatarUrl: true,
        avatarKey: true,
      },
    });

    if (currentProfile?.avatarKey) {
      deleteFromR2(currentProfile.avatarKey).catch((error) => {
        console.warn("Failed to delete previous avatar from R2", error);
      });
    }

    return apiSuccess({
      url: updatedProfile.avatarUrl,
      key: updatedProfile.avatarKey,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
