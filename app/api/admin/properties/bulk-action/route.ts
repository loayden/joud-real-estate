import { NextRequest } from "next/server";
import { z } from "zod";

import { snapshotPropertyForAudit } from "@/lib/admin-properties";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { bustPropertyCache } from "@/lib/cache-bust";
import {
  getAppUrl,
  sendPropertyApprovedEmail,
  sendPropertyRejectedEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bulkActionSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
  action: z.enum(["approve", "reject", "archive"]),
  reason: z.string().trim().max(2000).optional(),
});

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

function ownerLocale(property: {
  user: { profile: { preferredLocale: string } | null };
}) {
  return property.user.profile?.preferredLocale === "en" ? "en" : "ar";
}

function ownerName(property: {
  user: {
    email: string;
    profile: { firstName: string; lastName: string } | null;
  };
}) {
  return (
    [property.user.profile?.firstName, property.user.profile?.lastName]
      .filter(Boolean)
      .join(" ") || property.user.email
  );
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = bulkActionSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid bulk action data", 400, "VALIDATION_ERROR");
    }

    const { ids, action, reason } = parsed.data;

    if (action === "reject" && (!reason || reason.trim().length < 10)) {
      return apiError(
        "Rejection reason must be at least 10 characters",
        400,
        "VALIDATION_ERROR",
      );
    }

    const properties = await prisma.property.findMany({
      where: { id: { in: ids } },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                preferredLocale: true,
              },
            },
          },
        },
      },
    });

    if (properties.length !== ids.length) {
      return apiError(
        "One or more properties were not found",
        404,
        "NOT_FOUND",
      );
    }

    const now = new Date();
    const ipAddress = requestIp(req);
    const updated = await prisma.$transaction(async (tx) => {
      const rows = [];

      for (const property of properties) {
        const next = await tx.property.update({
          where: { id: property.id },
          data:
            action === "approve"
              ? {
                  status: "APPROVED",
                  approvedAt: now,
                  approvedBy: session.user.id,
                  publishedAt: property.publishedAt ?? now,
                  rejectionReason: null,
                }
              : action === "reject"
                ? {
                    status: "REJECTED",
                    approvedAt: null,
                    approvedBy: null,
                    rejectionReason: reason,
                  }
                : {
                    status: "ARCHIVED",
                    isFeatured: false,
                    featuredUntil: null,
                  },
        });

        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            action:
              action === "approve"
                ? "BULK_APPROVE_PROPERTY"
                : action === "reject"
                  ? "BULK_REJECT_PROPERTY"
                  : "BULK_ARCHIVE_PROPERTY",
            entity: "Property",
            entityId: property.id,
            oldValues: snapshotPropertyForAudit(property),
            newValues: snapshotPropertyForAudit(next),
            ipAddress,
            metadata: { bulkAction: action, reason: reason ?? null },
          },
        });

        rows.push(next);
      }

      return rows;
    });

    await Promise.allSettled(
      updated.map((property) =>
        bustPropertyCache({ propertyId: property.id, slug: property.slug }),
      ),
    );

    if (action === "approve" || action === "reject") {
      await Promise.allSettled(
        properties.map((property) => {
          const locale = ownerLocale(property);
          const name = ownerName(property);

          return action === "approve"
            ? sendPropertyApprovedEmail(
                property.user.email,
                {
                  ownerName: name,
                  propertyTitle: property.titleAr,
                  propertyUrl: `${getAppUrl()}/${locale}/property/${property.slug}`,
                },
                locale,
              )
            : sendPropertyRejectedEmail(
                property.user.email,
                {
                  ownerName: name,
                  propertyTitle: property.titleAr,
                  reason: reason ?? "",
                  editUrl: `${getAppUrl()}/${locale}/my-listings/${property.id}/edit`,
                },
                locale,
              );
        }),
      );
    }

    return apiSuccess({ count: updated.length, ids: updated.map((p) => p.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
