import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { bustPropertyCache } from "@/lib/cache-bust";
import { prisma } from "@/lib/prisma";
import {
  getNextPrimaryImage,
  requirePropertyImageAccess,
} from "@/lib/property-image-service";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  uploadRateLimit,
} from "@/lib/rate-limit";
import { deleteFromR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();
    const limit = await checkRateLimit(
      uploadRateLimit,
      `image-delete:${session.user.id}:${getRateLimitIdentifier(req)}`,
    );

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const image = await prisma.propertyImage.findUnique({
      where: { id: params.id },
    });

    if (!image) {
      return apiError("Image not found", 404, "IMAGE_NOT_FOUND");
    }

    const property = await requirePropertyImageAccess({
      propertyId: image.propertyId,
      role: session.user.role,
      userId: session.user.id,
    });

    await Promise.all([
      deleteFromR2(image.storageKey),
      deleteFromR2(image.thumbnailKey),
    ]);

    await prisma.$transaction(async (tx) => {
      await tx.propertyImage.delete({ where: { id: image.id } });

      if (image.isPrimary) {
        const nextImage = await getNextPrimaryImage(
          tx,
          image.propertyId,
          image.id,
        );

        if (nextImage) {
          await tx.propertyImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    if (property.status === "APPROVED") {
      await bustPropertyCache({ propertyId: property.id, slug: property.slug });
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
