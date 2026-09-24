import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/auth-utils";
import {
  findPropertyDetailById,
  findPropertyDetailByIdentifier,
  findPropertyForAccess,
  maybeRegenerateDraftSlug,
  mergePropertyForSubmit,
  syncPropertyAmenities,
  toPropertyUpdateData,
  validatePropertyRelations,
} from "@/lib/property-service";
import { prisma } from "@/lib/prisma";
import { bustPropertyCache } from "@/lib/cache-bust";
import { getCachedPublicPropertyBySlug } from "@/lib/public-properties";
import { serializeProperty } from "@/lib/property-serialization";
import { propertyMutationSchema } from "@/lib/validations/property";
import { sanitizePropertyInput } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

function decimalToNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return typeof value === "number" ? value : Number(value);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    const publicProperty = await getCachedPublicPropertyBySlug(params.id);

    if (publicProperty) {
      return apiSuccess(publicProperty);
    }

    const property = await findPropertyDetailByIdentifier(params.id);

    if (!property) {
      return apiError("Property not found", 404, "NOT_FOUND");
    }

    if (
      property.status !== "APPROVED" &&
      property.userId !== session?.user?.id &&
      !isAdmin(session?.user?.role)
    ) {
      return apiError("Property not found", 404, "NOT_FOUND");
    }

    return apiSuccess(serializeProperty(property));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();
    const existing = await findPropertyForAccess(params.id);

    if (!existing) {
      return apiError("Property not found", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id && !isAdmin(session.user.role)) {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const parsed = propertyMutationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid property data", 400, "VALIDATION_ERROR");
    }

    const sanitized = sanitizePropertyInput(parsed.data);
    const sanitizedParsed = propertyMutationSchema.safeParse(sanitized);

    if (!sanitizedParsed.success) {
      return apiError("Invalid property data", 400, "VALIDATION_ERROR");
    }

    const input = sanitizedParsed.data;
    const action = input.action ?? "draft";
    const previousPrice = decimalToNumber(existing.price);

    if (action === "submit") {
      const submitInput = mergePropertyForSubmit(existing, input);
      await validatePropertyRelations(submitInput);
      const nextPrice = Number(submitInput.price);

      await prisma.$transaction(async (tx) => {
        await tx.property.update({
          where: { id: existing.id },
          data: {
            ...toPropertyUpdateData(submitInput),
            status: "PENDING",
            publishedAt: new Date(),
            rejectionReason: null,
          },
        });
        await syncPropertyAmenities(tx, existing.id, submitInput.amenityIds);

        if (nextPrice !== previousPrice) {
          await tx.propertyPriceHistory.create({
            data: {
              propertyId: existing.id,
              price: submitInput.price,
              changedBy: session.user.id,
              note: "Price changed during submission",
            },
          });
        }
      });
    } else {
      const mergedForRelations = mergePropertyForSubmit(existing, {
        ...input,
        action: "draft",
      });
      await validatePropertyRelations(mergedForRelations);
      const slug = await maybeRegenerateDraftSlug({ existing, input });
      const shouldRecordPrice =
        input.price !== undefined && Number(input.price) !== previousPrice;

      await prisma.$transaction(async (tx) => {
        await tx.property.update({
          where: { id: existing.id },
          data: {
            ...toPropertyUpdateData(input),
            slug,
          },
        });

        if (input.amenityIds) {
          await syncPropertyAmenities(tx, existing.id, input.amenityIds);
        }

        if (shouldRecordPrice) {
          await tx.propertyPriceHistory.create({
            data: {
              propertyId: existing.id,
              price: input.price!,
              changedBy: session.user.id,
              note: "Price updated",
            },
          });
        }
      });
    }

    const property = await findPropertyDetailById(existing.id);
    await Promise.allSettled([
      bustPropertyCache({ propertyId: existing.id, slug: existing.slug }),
      property && property.slug !== existing.slug
        ? bustPropertyCache({ propertyId: property.id, slug: property.slug })
        : Promise.resolve(),
    ]);

    return apiSuccess(property ? serializeProperty(property) : null);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();
    const existing = await findPropertyForAccess(params.id);

    if (!existing) {
      return apiError("Property not found", 404, "NOT_FOUND");
    }

    if (existing.userId !== session.user.id && !isAdmin(session.user.role)) {
      return apiError("Forbidden", 403, "FORBIDDEN");
    }

    if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
      return apiError(
        "Only draft or rejected properties can be deleted",
        400,
        "DELETE_NOT_ALLOWED",
      );
    }

    await prisma.property.delete({ where: { id: existing.id } });
    await bustPropertyCache({ propertyId: existing.id, slug: existing.slug });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
