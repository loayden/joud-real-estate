import { NextRequest } from "next/server";

import { clearRegionCache, regionSchema } from "@/lib/admin-cms";
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
    const existing = await prisma.region.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError("Region not found", 404, "NOT_FOUND");
    }

    const parsed = regionSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid region data", 400, "VALIDATION_ERROR");
    }

    const region = await prisma.region.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await Promise.all([
      clearRegionCache(existing.slug),
      clearRegionCache(region.slug),
      logAudit({
        actorId: session.user.id,
        action: "UPDATE_REGION",
        entity: "Region",
        entityId: region.id,
        oldValues: existing,
        newValues: region,
        ipAddress: requestIp(req),
      }),
    ]);

    return apiSuccess(region);
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
    const existing = await prisma.region.findUnique({
      where: { id: params.id },
      include: { _count: { select: { cities: true, properties: true } } },
    });

    if (!existing) {
      return apiError("Region not found", 404, "NOT_FOUND");
    }

    if (existing._count.cities > 0 || existing._count.properties > 0) {
      return apiError(
        "Region has dependent cities or properties",
        400,
        "REGION_IN_USE",
      );
    }

    await prisma.region.delete({ where: { id: params.id } });
    await clearRegionCache(existing.slug);
    await logAudit({
      actorId: session.user.id,
      action: "DELETE_REGION",
      entity: "Region",
      entityId: existing.id,
      oldValues: existing,
      ipAddress: requestIp(req),
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
