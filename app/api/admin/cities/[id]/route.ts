import { NextRequest } from "next/server";

import {
  citySchema,
  clearCityCache,
  clearRegionCache,
  serializeCity,
} from "@/lib/admin-cms";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const existing = await prisma.city.findUnique({
      where: { id: params.id },
      include: { region: { select: { slug: true } } },
    });

    if (!existing) {
      return apiError("City not found", 404, "NOT_FOUND");
    }

    const parsed = citySchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid city data", 400, "VALIDATION_ERROR");
    }

    const nextRegion = await prisma.region.findUnique({
      where: { id: parsed.data.regionId },
      select: { slug: true },
    });

    if (!nextRegion) {
      return apiError("Region not found", 404, "REGION_NOT_FOUND");
    }

    const city = await prisma.city.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        _count: { select: { neighborhoods: true, properties: true } },
      },
    });

    await Promise.all([
      clearRegionCache(existing.region.slug),
      clearRegionCache(nextRegion.slug),
      clearCityCache(existing.slug),
      clearCityCache(city.slug),
      logAudit({
        actorId: session.user.id,
        action: "UPDATE_CITY",
        entity: "City",
        entityId: city.id,
        oldValues: existing,
        newValues: city,
        ipAddress: requestIp(req),
      }),
    ]);

    return apiSuccess(serializeCity(city));
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
    const existing = await prisma.city.findUnique({
      where: { id: params.id },
      include: {
        region: { select: { slug: true } },
        _count: { select: { neighborhoods: true, properties: true } },
      },
    });

    if (!existing) {
      return apiError("City not found", 404, "NOT_FOUND");
    }

    if (existing._count.neighborhoods > 0 || existing._count.properties > 0) {
      return apiError(
        "City has dependent neighborhoods or properties",
        400,
        "CITY_IN_USE",
      );
    }

    await prisma.city.delete({ where: { id: params.id } });
    await Promise.all([
      clearRegionCache(existing.region.slug),
      clearCityCache(existing.slug),
      logAudit({
        actorId: session.user.id,
        action: "DELETE_CITY",
        entity: "City",
        entityId: existing.id,
        oldValues: existing,
        ipAddress: requestIp(req),
      }),
    ]);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
