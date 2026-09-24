import { NextRequest } from "next/server";

import { clearCategoryCache, propertyTypeSchema } from "@/lib/admin-cms";
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
    const existing = await prisma.propertyType.findUnique({
      where: { id: params.id },
      include: { category: { select: { slug: true } } },
    });

    if (!existing) {
      return apiError("Property type not found", 404, "NOT_FOUND");
    }

    const parsed = propertyTypeSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid property type data", 400, "VALIDATION_ERROR");
    }

    const nextCategory = await prisma.propertyCategory.findUnique({
      where: { id: parsed.data.categoryId },
      select: { slug: true },
    });

    if (!nextCategory) {
      return apiError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }

    const type = await prisma.propertyType.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await Promise.all([
      clearCategoryCache(existing.category.slug),
      clearCategoryCache(nextCategory.slug),
      logAudit({
        actorId: session.user.id,
        action: "UPDATE_PROPERTY_TYPE",
        entity: "PropertyType",
        entityId: type.id,
        oldValues: existing,
        newValues: type,
        ipAddress: requestIp(req),
      }),
    ]);

    return apiSuccess(type);
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
    const existing = await prisma.propertyType.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { slug: true } },
        _count: { select: { properties: true } },
      },
    });

    if (!existing) {
      return apiError("Property type not found", 404, "NOT_FOUND");
    }

    if (existing._count.properties > 0) {
      return apiError(
        "Property type has dependent properties",
        400,
        "PROPERTY_TYPE_IN_USE",
      );
    }

    await prisma.propertyType.delete({ where: { id: params.id } });
    await clearCategoryCache(existing.category.slug);
    await logAudit({
      actorId: session.user.id,
      action: "DELETE_PROPERTY_TYPE",
      entity: "PropertyType",
      entityId: existing.id,
      oldValues: existing,
      ipAddress: requestIp(req),
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
