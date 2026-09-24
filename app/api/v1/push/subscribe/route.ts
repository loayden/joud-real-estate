import type { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireV1Auth } from "@/lib/auth-v1";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(500),
  keys: z.object({
    p256dh: z.string().min(20).max(200),
    auth: z.string().min(8).max(100),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireV1Auth(req);
    const parsed = pushSubscriptionSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid push subscription", 400, "VALIDATION_ERROR");
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      update: {
        userId: user.id,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
      create: {
        userId: user.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
      },
    });

    return apiSuccess(subscription, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
