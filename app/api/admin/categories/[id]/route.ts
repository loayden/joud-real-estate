import { NextRequest } from "next/server";

import { categorySchema, clearCategoryCache } from "@/lib/admin-cms";
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
    const existing = await prisma.propertyCategory.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError("Category not found", 404, "NOT_FOUND");
    }

    const parsed = categorySchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid category data", 400, "VALIDATION_ERROR");
    }

    const category = await prisma.propertyCategory.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await Promise.all([
      clearCategoryCache(existing.slug),
      clearCategoryCache(category.slug),
      logAudit({
        actorId: session.user.id,
        action: "UPDATE_CATEGORY",
        entity: "PropertyCategory",
        entityId: category.id,
        oldValues: existing,
        newValues: category,
        ipAddress: requestIp(req),
      }),
    ]);

    return apiSuccess(category);
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
    const existing = await prisma.propertyCategory.findUnique({
      where: { id: params.id },
      include: { _count: { select: { types: true, properties: true } } },
    });

    if (!existing) {
      return apiError("Category not found", 404, "NOT_FOUND");
    }

    if (existing._count.types > 0 || existing._count.properties > 0) {
      return apiError(
        "Category has dependent types or properties",
        400,
        "CATEGORY_IN_USE",
      );
    }

    await prisma.propertyCategory.delete({ where: { id: params.id } });
    await clearCategoryCache(existing.slug);
    await logAudit({
      actorId: session.user.id,
      action: "DELETE_CATEGORY",
      entity: "PropertyCategory",
      entityId: existing.id,
      oldValues: existing,
      ipAddress: requestIp(req),
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
