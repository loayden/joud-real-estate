import { Prisma, type ReportStatus } from "@prisma/client";

import { HttpError } from "@/lib/api-response";
import { getAppUrl, sendPriceDropAlertEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  propertyDetailInclude,
  serializeProperty,
} from "@/lib/property-serialization";
import { sanitizeOptionalPlainText } from "@/lib/sanitize";
import type {
  priceAlertSchema,
  reportPropertySchema,
  reportResolveSchema,
} from "@/lib/validations/phase25";
import type { z } from "zod";

type PriceAlertInput = z.infer<typeof priceAlertSchema>;
type ReportInput = z.infer<typeof reportPropertySchema>;
type ResolveReportInput = z.infer<typeof reportResolveSchema>;

function decimalToNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return typeof value === "number" ? value : Number(value);
}

function serializePriceAlert(
  alert: Prisma.PriceAlertGetPayload<{
    include: {
      property: {
        include: {
          images: true;
          city: true;
        };
      };
    };
  }>,
) {
  return {
    id: alert.id,
    propertyId: alert.propertyId,
    targetPrice:
      alert.targetPrice === null ? null : decimalToNumber(alert.targetPrice),
    lastPriceSeen: decimalToNumber(alert.lastPriceSeen),
    isActive: alert.isActive,
    lastAlertAt: alert.lastAlertAt?.toISOString() ?? null,
    createdAt: alert.createdAt.toISOString(),
    property: {
      id: alert.property.id,
      slug: alert.property.slug,
      titleAr: alert.property.titleAr,
      titleEn: alert.property.titleEn,
      price: decimalToNumber(alert.property.price),
      currency: alert.property.currency,
      city: alert.property.city,
      primaryImageUrl:
        alert.property.images.find((image) => image.isPrimary)?.thumbnailUrl ??
        alert.property.images[0]?.thumbnailUrl ??
        alert.property.images[0]?.url ??
        null,
    },
  };
}

function serializeReport(
  report: Prisma.PropertyReportGetPayload<{
    include: {
      property: {
        select: {
          id: true;
          slug: true;
          titleAr: true;
          titleEn: true;
          userId: true;
        };
      };
      reporter: {
        select: {
          id: true;
          email: true;
          profile: {
            select: {
              firstName: true;
              lastName: true;
            };
          };
        };
      };
    };
  }>,
) {
  return {
    id: report.id,
    propertyId: report.propertyId,
    reporterId: report.reporterId,
    reason: report.reason,
    details: report.details,
    status: report.status,
    resolvedBy: report.resolvedBy,
    resolvedAt: report.resolvedAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
    property: report.property,
    reporter: report.reporter,
  };
}

export async function getComparisonProperties(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids)).slice(0, 4);

  const properties = await prisma.property.findMany({
    where: {
      id: { in: uniqueIds },
      status: "APPROVED",
    },
    include: propertyDetailInclude,
  });

  const byId = new Map(
    properties.map((property) => [property.id, serializeProperty(property)]),
  );

  return uniqueIds
    .map((id) => byId.get(id))
    .filter((property): property is NonNullable<typeof property> =>
      Boolean(property),
    );
}

export async function upsertPriceAlert(userId: string, input: PriceAlertInput) {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true, status: true, userId: true, price: true },
  });

  if (!property || property.status !== "APPROVED") {
    throw new HttpError("Property not found", 404, "NOT_FOUND");
  }

  if (property.userId === userId) {
    throw new HttpError(
      "Owners cannot subscribe to their own listing alerts",
      400,
      "SELF_ALERT",
    );
  }

  const alert = await prisma.priceAlert.upsert({
    where: {
      userId_propertyId: { userId, propertyId: input.propertyId },
    },
    update: {
      targetPrice: input.targetPrice,
      lastPriceSeen: property.price,
      isActive: true,
    },
    create: {
      userId,
      propertyId: input.propertyId,
      targetPrice: input.targetPrice,
      lastPriceSeen: property.price,
    },
    include: {
      property: {
        include: {
          images: true,
          city: true,
        },
      },
    },
  });

  return serializePriceAlert(alert);
}

export async function getUserPriceAlerts(userId: string) {
  const alerts = await prisma.priceAlert.findMany({
    where: { userId, isActive: true },
    include: {
      property: {
        include: {
          images: true,
          city: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return alerts.map(serializePriceAlert);
}

export async function deletePriceAlert(alertId: string, userId: string) {
  const alert = await prisma.priceAlert.findUnique({
    where: { id: alertId },
    select: { id: true, userId: true },
  });

  if (!alert) {
    throw new HttpError("Alert not found", 404, "NOT_FOUND");
  }

  if (alert.userId !== userId) {
    throw new HttpError("Forbidden", 403, "FORBIDDEN");
  }

  await prisma.priceAlert.delete({ where: { id: alertId } });
  return { deleted: true };
}

export async function getPriceHistory(propertyId: string) {
  const history = await prisma.propertyPriceHistory.findMany({
    where: { propertyId },
    orderBy: { createdAt: "asc" },
  });

  return history.map((item) => ({
    id: item.id,
    propertyId: item.propertyId,
    price: decimalToNumber(item.price),
    changedBy: item.changedBy,
    note: item.note,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function getPropertyEstimate(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      cityId: true,
      typeId: true,
      price: true,
      area: true,
      currency: true,
      status: true,
    },
  });

  if (!property || property.status !== "APPROVED") {
    throw new HttpError("Property not found", 404, "NOT_FOUND");
  }

  const similar = await prisma.property.findMany({
    where: {
      status: "APPROVED",
      cityId: property.cityId,
      typeId: property.typeId,
      area: { gt: new Prisma.Decimal(0) },
      NOT: { id: property.id },
    },
    select: { price: true, area: true },
    take: 100,
  });

  const samples = similar
    .map((item) => decimalToNumber(item.price) / decimalToNumber(item.area))
    .filter((value) => Number.isFinite(value) && value > 0);

  const fallbackPricePerSqm =
    decimalToNumber(property.price) /
    Math.max(decimalToNumber(property.area), 1);
  const averagePricePerSqm = samples.length
    ? samples.reduce((total, value) => total + value, 0) / samples.length
    : fallbackPricePerSqm;
  const baseEstimate = averagePricePerSqm * decimalToNumber(property.area);

  return {
    propertyId,
    currency: property.currency,
    sampleSize: samples.length,
    averagePricePerSqm: Math.round(averagePricePerSqm),
    low: Math.round(baseEstimate * 0.9),
    mid: Math.round(baseEstimate),
    high: Math.round(baseEstimate * 1.1),
    confidence:
      samples.length >= 10 ? "high" : samples.length >= 3 ? "medium" : "low",
    algorithm: "city_type_price_per_sqm_v1",
  };
}

export async function createPropertyReport(userId: string, input: ReportInput) {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true, userId: true, status: true },
  });

  if (!property || property.status !== "APPROVED") {
    throw new HttpError("Property not found", 404, "NOT_FOUND");
  }

  if (property.userId === userId) {
    throw new HttpError(
      "Owners cannot report their own listing",
      400,
      "SELF_REPORT",
    );
  }

  const existingOpenReport = await prisma.propertyReport.findFirst({
    where: {
      propertyId: input.propertyId,
      reporterId: userId,
      status: { in: ["OPEN", "REVIEWING"] },
    },
    select: { id: true },
  });

  if (existingOpenReport) {
    throw new HttpError(
      "You already have an open report for this property",
      409,
      "REPORT_ALREADY_OPEN",
    );
  }

  const report = await prisma.propertyReport.create({
    data: {
      propertyId: input.propertyId,
      reporterId: userId,
      reason: input.reason,
      details: sanitizeOptionalPlainText(input.details),
    },
    include: {
      property: {
        select: {
          id: true,
          slug: true,
          titleAr: true,
          titleEn: true,
          userId: true,
        },
      },
      reporter: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return serializeReport(report);
}

export async function getAdminReports(status?: ReportStatus) {
  const reports = await prisma.propertyReport.findMany({
    where: status ? { status } : { status: { in: ["OPEN", "REVIEWING"] } },
    include: {
      property: {
        select: {
          id: true,
          slug: true,
          titleAr: true,
          titleEn: true,
          userId: true,
        },
      },
      reporter: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return reports.map(serializeReport);
}

export async function resolvePropertyReport({
  reportId,
  actorId,
  input,
}: {
  reportId: string;
  actorId: string;
  input: ResolveReportInput;
}) {
  const existing = await prisma.propertyReport.findUnique({
    where: { id: reportId },
  });

  if (!existing) {
    throw new HttpError("Report not found", 404, "NOT_FOUND");
  }

  const report = await prisma.$transaction(async (tx) => {
    const updated = await tx.propertyReport.update({
      where: { id: reportId },
      data: {
        status: input.status,
        resolvedBy:
          input.status === "RESOLVED" || input.status === "DISMISSED"
            ? actorId
            : null,
        resolvedAt:
          input.status === "RESOLVED" || input.status === "DISMISSED"
            ? new Date()
            : null,
      },
      include: {
        property: {
          select: {
            id: true,
            slug: true,
            titleAr: true,
            titleEn: true,
            userId: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "RESOLVE_PROPERTY_REPORT",
        entity: "PropertyReport",
        entityId: reportId,
        oldValues: {
          id: existing.id,
          propertyId: existing.propertyId,
          reporterId: existing.reporterId,
          reason: existing.reason,
          details: existing.details,
          status: existing.status,
          resolvedBy: existing.resolvedBy,
          resolvedAt: existing.resolvedAt?.toISOString() ?? null,
          createdAt: existing.createdAt.toISOString(),
        },
        newValues: {
          status: input.status,
          action: input.action ?? null,
        },
      },
    });

    return updated;
  });

  return serializeReport(report);
}

export async function getNeighbourhoodScore(slug: string) {
  const property = await prisma.property.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      amenities: { include: { amenity: true } },
      city: true,
      neighborhood: true,
    },
  });

  if (!property) {
    throw new HttpError("Property not found", 404, "NOT_FOUND");
  }

  const amenityNames = property.amenities
    .flatMap((item) => [item.amenity.nameAr, item.amenity.nameEn])
    .join(" ")
    .toLowerCase();
  const hasCoordinates = Boolean(property.latitude && property.longitude);

  const dimensions = [
    {
      key: "mosque",
      labelAr: "القرب من المسجد",
      labelEn: "Mosque proximity",
      score:
        amenityNames.includes("مسجد") || amenityNames.includes("mosque")
          ? 96
          : hasCoordinates
            ? 82
            : 70,
    },
    {
      key: "schools",
      labelAr: "القرب من المدارس",
      labelEn: "School proximity",
      score:
        amenityNames.includes("مدارس") || amenityNames.includes("school")
          ? 92
          : hasCoordinates
            ? 78
            : 68,
    },
    {
      key: "hospital",
      labelAr: "القرب من المستشفى",
      labelEn: "Hospital proximity",
      score:
        amenityNames.includes("مستشفى") || amenityNames.includes("hospital")
          ? 90
          : hasCoordinates
            ? 75
            : 64,
    },
    {
      key: "markets",
      labelAr: "القرب من الأسواق",
      labelEn: "Market proximity",
      score:
        amenityNames.includes("أسواق") || amenityNames.includes("market")
          ? 94
          : hasCoordinates
            ? 80
            : 66,
    },
  ];
  const overall = Math.round(
    dimensions.reduce((total, dimension) => total + dimension.score, 0) /
      dimensions.length,
  );

  return {
    propertyId: property.id,
    slug: property.slug,
    neighbourhood: property.neighborhood,
    city: property.city,
    overall,
    dimensions,
    method: "amenity_presence_and_coordinate_quality_v1",
  };
}

export async function checkPriceAlerts() {
  const alerts = await prisma.priceAlert.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          profile: { select: { preferredLocale: true, firstName: true } },
        },
      },
      property: {
        select: {
          id: true,
          slug: true,
          titleAr: true,
          titleEn: true,
          price: true,
          currency: true,
        },
      },
    },
    take: 500,
  });

  const triggered = [];

  for (const alert of alerts) {
    const currentPrice = decimalToNumber(alert.property.price);
    const lastPriceSeen = decimalToNumber(alert.lastPriceSeen);
    const targetPrice =
      alert.targetPrice === null ? null : decimalToNumber(alert.targetPrice);
    const priceDropped = currentPrice < lastPriceSeen;
    const targetReached = targetPrice === null || currentPrice <= targetPrice;

    if (!priceDropped || !targetReached) {
      if (currentPrice !== lastPriceSeen) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { lastPriceSeen: alert.property.price },
        });
      }
      continue;
    }

    triggered.push({
      alertId: alert.id,
      userId: alert.userId,
      email: alert.user.email,
      phone: alert.user.phone,
      propertyId: alert.propertyId,
      propertySlug: alert.property.slug,
      propertyTitle: alert.property.titleAr,
      previousPrice: lastPriceSeen,
      currentPrice,
      currency: alert.property.currency,
    });

    await sendPriceDropAlertEmail(
      alert.user.email,
      {
        firstName: alert.user.profile?.firstName,
        propertyTitle: alert.property.titleAr,
        propertyUrl: `${getAppUrl()}/${alert.user.profile?.preferredLocale ?? "ar"}/property/${alert.property.slug}`,
        previousPrice: lastPriceSeen,
        currentPrice,
        currency: alert.property.currency,
      },
      alert.user.profile?.preferredLocale === "en" ? "en" : "ar",
    );

    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: {
        lastPriceSeen: alert.property.price,
        lastAlertAt: new Date(),
      },
    });
  }

  return {
    checked: alerts.length,
    triggered,
    whatsappProviderConfigured: false,
  };
}
