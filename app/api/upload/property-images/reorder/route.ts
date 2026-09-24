import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { bustPropertyCache } from "@/lib/cache-bust";
import { prisma } from "@/lib/prisma";
import { requirePropertyImageAccess } from "@/lib/property-image-service";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  uploadRateLimit,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reorderSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string().cuid(),
        sortOrder: z.coerce.number().int().min(0).max(1000),
      }),
    )
    .min(1)
    .max(20),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();
    const limit = await checkRateLimit(
      uploadRateLimit,
      `image-reorder:${session.user.id}:${getRateLimitIdentifier(req)}`,
    );

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid reorder payload", 400, "VALIDATION_ERROR");
    }

    const firstImage = await prisma.propertyImage.findUnique({
      where: { id: parsed.data.images[0].id },
      select: { propertyId: true },
    });

    if (!firstImage) {
      return apiError("Image not found", 404, "IMAGE_NOT_FOUND");
    }

    const property = await requirePropertyImageAccess({
      propertyId: firstImage.propertyId,
      role: session.user.role,
      userId: session.user.id,
    });

    const imageIds = parsed.data.images.map((image) => image.id);
    const imageCount = await prisma.propertyImage.count({
      where: { id: { in: imageIds }, propertyId: firstImage.propertyId },
    });

    if (imageCount !== imageIds.length) {
      return apiError(
        "Images must belong to one property",
        400,
        "INVALID_IMAGES",
      );
    }

    await prisma.$transaction(
      parsed.data.images.map((image) =>
        prisma.propertyImage.update({
          where: { id: image.id },
          data: { sortOrder: image.sortOrder },
        }),
      ),
    );

    if (property.status === "APPROVED") {
      await bustPropertyCache({ propertyId: property.id, slug: property.slug });
    }

    return apiSuccess({ updated: parsed.data.images.length });
  } catch (error) {
    return handleApiError(error);
  }
}
