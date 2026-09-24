import type { PropertyStatus } from "@prisma/client";

import { HttpError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import {
  snapshotPropertyForAudit,
  serializeAdminPropertyListItem,
} from "@/lib/admin-properties";
import {
  getAppUrl,
  sendPropertyApprovedEmail,
  sendPropertyRejectedEmail,
} from "@/lib/email";
import { bustPropertyCache } from "@/lib/cache-bust";
import { prisma } from "@/lib/prisma";

const propertyWithOwnerInclude = {
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { thumbnailUrl: true, url: true },
  },
  city: { select: { nameAr: true, nameEn: true, slug: true } },
  region: { select: { nameAr: true, nameEn: true, slug: true } },
  category: { select: { nameAr: true, nameEn: true, slug: true } },
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          preferredLocale: true,
        },
      },
    },
  },
} as const;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getOwnerName(property: {
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

function getOwnerLocale(property: {
  user: { profile: { preferredLocale: string } | null };
}) {
  return property.user.profile?.preferredLocale === "en" ? "en" : "ar";
}

async function notifyApproval(
  property: Awaited<ReturnType<typeof loadPropertyForAction>>,
) {
  if (!property) return;

  const locale = getOwnerLocale(property);
  const propertyUrl = `${getAppUrl()}/${locale}/property/${property.slug}`;

  try {
    await sendPropertyApprovedEmail(
      property.user.email,
      {
        ownerName: getOwnerName(property),
        propertyTitle: property.titleAr,
        propertyUrl,
      },
      locale,
    );
  } catch (error) {
    console.warn(`Failed to send property approval email for ${property.id}`, {
      error,
    });
  }
}

async function notifyRejection(
  property: Awaited<ReturnType<typeof loadPropertyForAction>>,
  reason: string,
) {
  if (!property) return;

  const locale = getOwnerLocale(property);
  const editUrl = `${getAppUrl()}/${locale}/my-listings/${property.id}/edit`;

  try {
    await sendPropertyRejectedEmail(
      property.user.email,
      {
        ownerName: getOwnerName(property),
        propertyTitle: property.titleAr,
        reason,
        editUrl,
      },
      locale,
    );
  } catch (error) {
    console.warn(`Failed to send property rejection email for ${property.id}`, {
      error,
    });
  }
}

export async function loadPropertyForAction(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: propertyWithOwnerInclude,
  });
}

export async function approveProperty({
  propertyId,
  actorId,
  ipAddress,
}: {
  propertyId: string;
  actorId: string;
  ipAddress?: string | null;
}) {
  const existing = await loadPropertyForAction(propertyId);

  if (!existing) {
    throw new HttpError("Property not found", 404, "NOT_FOUND");
  }

  const now = new Date();
  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      status: "APPROVED",
      approvedAt: now,
      approvedBy: actorId,
      publishedAt: existing.publishedAt ?? now,
      rejectionReason: null,
    },
    include: propertyWithOwnerInclude,
  });

  await logAudit({
    actorId,
    action: "APPROVE_PROPERTY",
    entity: "Property",
    entityId: propertyId,
    oldValues: snapshotPropertyForAudit(existing),
    newValues: snapshotPropertyForAudit(updated),
    ipAddress,
  });

  await bustPropertyCache({ propertyId: updated.id, slug: updated.slug });
  await notifyApproval(updated);

  return serializeAdminPropertyListItem(updated);
}

export async function rejectProperty({
  propertyId,
  actorId,
  reason,
  ipAddress,
}: {
  propertyId: string;
  actorId: string;
  reason: string;
  ipAddress?: string | null;
}) {
  const existing = await loadPropertyForAction(propertyId);

  if (!existing) {
    throw new HttpError("Property not found", 404, "NOT_FOUND");
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      status: "REJECTED",
      approvedAt: null,
      approvedBy: null,
      rejectionReason: reason,
    },
    include: propertyWithOwnerInclude,
  });

  await logAudit({
    actorId,
    action: "REJECT_PROPERTY",
    entity: "Property",
    entityId: propertyId,
    oldValues: snapshotPropertyForAudit(existing),
    newValues: snapshotPropertyForAudit(updated),
    ipAddress,
    metadata: { reason },
  });

  await bustPropertyCache({ propertyId: updated.id, slug: updated.slug });
  await notifyRejection(updated, reason);

  return serializeAdminPropertyListItem(updated);
}

export async function setPropertyFeatured({
  propertyId,
  actorId,
  isFeatured,
  ipAddress,
}: {
  propertyId: string;
  actorId: string;
  isFeatured?: boolean;
  ipAddress?: string | null;
}) {
  const existing = await loadPropertyForAction(propertyId);

  if (!existing) {
    throw new HttpError("Property not found", 404, "NOT_FOUND");
  }

  const nextFeatured = isFeatured ?? !existing.isFeatured;
  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      isFeatured: nextFeatured,
      featuredUntil: nextFeatured ? addDays(new Date(), 30) : null,
    },
    include: propertyWithOwnerInclude,
  });

  await logAudit({
    actorId,
    action: nextFeatured ? "FEATURE_PROPERTY" : "UNFEATURE_PROPERTY",
    entity: "Property",
    entityId: propertyId,
    oldValues: snapshotPropertyForAudit(existing),
    newValues: snapshotPropertyForAudit(updated),
    ipAddress,
  });

  await bustPropertyCache({ propertyId: updated.id, slug: updated.slug });

  return serializeAdminPropertyListItem(updated);
}

export async function archiveProperty({
  propertyId,
  actorId,
  ipAddress,
}: {
  propertyId: string;
  actorId: string;
  ipAddress?: string | null;
}) {
  const existing = await loadPropertyForAction(propertyId);

  if (!existing) {
    throw new HttpError("Property not found", 404, "NOT_FOUND");
  }

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      status: "ARCHIVED" satisfies PropertyStatus,
      isFeatured: false,
      featuredUntil: null,
    },
    include: propertyWithOwnerInclude,
  });

  await logAudit({
    actorId,
    action: "ARCHIVE_PROPERTY",
    entity: "Property",
    entityId: propertyId,
    oldValues: snapshotPropertyForAudit(existing),
    newValues: snapshotPropertyForAudit(updated),
    ipAddress,
  });

  await bustPropertyCache({ propertyId: updated.id, slug: updated.slug });

  return serializeAdminPropertyListItem(updated);
}
