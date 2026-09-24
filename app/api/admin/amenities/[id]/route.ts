import { NextRequest } from "next/server";

import { amenitySchema, clearAmenityCache } from "@/lib/admin-cms";
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
    const existing = await prisma.amenity.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError("Amenity not found", 404, "NOT_FOUND");
    }

    const parsed = amenitySchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid amenity data", 400, "VALIDATION_ERROR");
    }

    const amenity = await prisma.amenity.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await Promise.all([
      clearAmenityCache(),
      logAudit({
        actorId: session.user.id,
        action: "UPDATE_AMENITY",
        entity: "Amenity",
        entityId: amenity.id,
        oldValues: existing,
        newValues: amenity,
        ipAddress: requestIp(req),
      }),
    ]);

    return apiSuccess(amenity);
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
    const existing = await prisma.amenity.findUnique({
      where: { id: params.id },
      include: { _count: { select: { properties: true } } },
    });

    if (!existing) {
      return apiError("Amenity not found", 404, "NOT_FOUND");
    }

    if (existing._count.properties > 0) {
      return apiError(
        "Amenity has dependent properties",
        400,
        "AMENITY_IN_USE",
      );
    }

    await prisma.amenity.delete({ where: { id: params.id } });
    await Promise.all([
      clearAmenityCache(),
      logAudit({
        actorId: session.user.id,
        action: "DELETE_AMENITY",
        entity: "Amenity",
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
