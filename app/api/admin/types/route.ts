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

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const categoryId =
      new URL(req.url).searchParams.get("categoryId") ?? undefined;
    const types = await prisma.propertyType.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
      include: { _count: { select: { properties: true } } },
    });

    return apiSuccess(types);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = propertyTypeSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid property type data", 400, "VALIDATION_ERROR");
    }

    const category = await prisma.propertyCategory.findUnique({
      where: { id: parsed.data.categoryId },
      select: { slug: true },
    });

    if (!category) {
      return apiError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }

    const type = await prisma.propertyType.create({ data: parsed.data });
    await clearCategoryCache(category.slug);
    await logAudit({
      actorId: session.user.id,
      action: "CREATE_PROPERTY_TYPE",
      entity: "PropertyType",
      entityId: type.id,
      newValues: type,
      ipAddress: requestIp(req),
    });

    return apiSuccess(type, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
