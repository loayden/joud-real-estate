import { NextRequest } from "next/server";
import { z } from "zod";

import { setPropertyFeatured } from "@/lib/admin-property-actions";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const featureSchema = z
  .object({
    isFeatured: z.boolean().optional(),
  })
  .optional();

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const body = await req.json().catch(() => undefined);
    const parsed = featureSchema.safeParse(body);
    const property = await setPropertyFeatured({
      propertyId: params.id,
      actorId: session.user.id,
      isFeatured: parsed.success ? parsed.data?.isFeatured : undefined,
      ipAddress: requestIp(req),
    });

    return apiSuccess(property);
  } catch (error) {
    return handleApiError(error);
  }
}
