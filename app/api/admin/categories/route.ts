import { NextRequest } from "next/server";

import {
  categorySchema,
  clearCategoryCache,
  getAdminClassifications,
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

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    return apiSuccess(await getAdminClassifications());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = categorySchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid category data", 400, "VALIDATION_ERROR");
    }

    const category = await prisma.propertyCategory.create({
      data: parsed.data,
    });
    await clearCategoryCache(category.slug);
    await logAudit({
      actorId: session.user.id,
      action: "CREATE_CATEGORY",
      entity: "PropertyCategory",
      entityId: category.id,
      newValues: category,
      ipAddress: requestIp(req),
    });

    return apiSuccess(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
