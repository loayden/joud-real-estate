import { NextRequest } from "next/server";

import { archiveProperty } from "@/lib/admin-property-actions";
import {
  getAdminPropertyForReview,
  snapshotPropertyForAudit,
} from "@/lib/admin-properties";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth-utils";
import { bustPropertyCache } from "@/lib/cache-bust";
import {
  findPropertyDetailById,
  findPropertyForAccess,
  maybeRegenerateDraftSlug,
  mergePropertyForSubmit,
  syncPropertyAmenities,
  toPropertyUpdateData,
  validatePropertyRelations,
} from "@/lib/property-service";
import { prisma } from "@/lib/prisma";
import { sanitizePropertyInput } from "@/lib/sanitize";
import { propertyMutationSchema } from "@/lib/validations/property";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
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
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const property = await getAdminPropertyForReview(params.id);

    if (!property) {
      return apiError("Property not found", 404, "NOT_FOUND");
    }

    return apiSuccess(property);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const existing = await findPropertyForAccess(params.id);

    if (!existing) {
      return apiError("Property not found", 404, "NOT_FOUND");
    }

    const parsed = propertyMutationSchema.safeParse(await req.json());

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
              note: "Admin price update during submission",
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
              note: "Admin price update",
            },
          });
        }
      });
    }

    const updated = await findPropertyDetailById(existing.id);

    if (updated) {
      await logAudit({
        actorId: session.user.id,
        action: "EDIT_PROPERTY",
        entity: "Property",
        entityId: existing.id,
        oldValues: snapshotPropertyForAudit(existing),
        newValues: snapshotPropertyForAudit(updated),
        ipAddress: requestIp(req),
      });

      await Promise.allSettled([
        bustPropertyCache({ propertyId: existing.id, slug: existing.slug }),
        updated.slug !== existing.slug
          ? bustPropertyCache({ propertyId: updated.id, slug: updated.slug })
          : Promise.resolve(),
      ]);
    }

    const review = await getAdminPropertyForReview(existing.id);

    return apiSuccess(review?.property ?? null);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const property = await archiveProperty({
      propertyId: params.id,
      actorId: session.user.id,
      ipAddress: requestIp(req),
    });

    return apiSuccess({ archived: true, property });
  } catch (error) {
    return handleApiError(error);
  }
}
