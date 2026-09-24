import { NextRequest } from "next/server";

import { clearCityCache, neighborhoodSchema } from "@/lib/admin-cms";
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
    const existing = await prisma.neighborhood.findUnique({
      where: { id: params.id },
      include: { city: { select: { slug: true } } },
    });

    if (!existing) {
      return apiError("Neighborhood not found", 404, "NOT_FOUND");
    }

    const parsed = neighborhoodSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid neighborhood data", 400, "VALIDATION_ERROR");
    }

    const nextCity = await prisma.city.findUnique({
      where: { id: parsed.data.cityId },
      select: { slug: true },
    });

    if (!nextCity) {
      return apiError("City not found", 404, "CITY_NOT_FOUND");
    }

    const neighborhood = await prisma.neighborhood.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await Promise.all([
      clearCityCache(existing.city.slug),
      clearCityCache(nextCity.slug),
      logAudit({
        actorId: session.user.id,
        action: "UPDATE_NEIGHBORHOOD",
        entity: "Neighborhood",
        entityId: neighborhood.id,
        oldValues: existing,
        newValues: neighborhood,
        ipAddress: requestIp(req),
      }),
    ]);

    return apiSuccess(neighborhood);
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
    const existing = await prisma.neighborhood.findUnique({
      where: { id: params.id },
      include: {
        city: { select: { slug: true } },
        _count: { select: { properties: true } },
      },
    });

    if (!existing) {
      return apiError("Neighborhood not found", 404, "NOT_FOUND");
    }

    if (existing._count.properties > 0) {
      return apiError(
        "Neighborhood has dependent properties",
        400,
        "NEIGHBORHOOD_IN_USE",
      );
    }

    await prisma.neighborhood.delete({ where: { id: params.id } });
    await Promise.all([
      clearCityCache(existing.city.slug),
      logAudit({
        actorId: session.user.id,
        action: "DELETE_NEIGHBORHOOD",
        entity: "Neighborhood",
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
