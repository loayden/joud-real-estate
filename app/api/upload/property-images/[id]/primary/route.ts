import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();
    const limit = await checkRateLimit(
      uploadRateLimit,
      `image-primary:${session.user.id}:${getRateLimitIdentifier(req)}`,
    );

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const image = await prisma.propertyImage.findUnique({
      where: { id: params.id },
      select: { id: true, propertyId: true },
    });

    if (!image) {
      return apiError("Image not found", 404, "IMAGE_NOT_FOUND");
    }

    const property = await requirePropertyImageAccess({
      propertyId: image.propertyId,
      role: session.user.role,
      userId: session.user.id,
    });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.propertyImage.updateMany({
        where: { propertyId: image.propertyId },
        data: { isPrimary: false },
      });

      return tx.propertyImage.update({
        where: { id: image.id },
        data: { isPrimary: true },
      });
    });

    if (property.status === "APPROVED") {
      await bustPropertyCache({ propertyId: property.id, slug: property.slug });
    }

    return apiSuccess(serializePropertyImage(updated));
  } catch (error) {
    return handleApiError(error);
  }
}
