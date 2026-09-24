import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { generateToken } from "@/lib/auth-utils";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  authRateLimit,
  checkRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  const genericResponse = {
    message:
      "If an account exists for this email, password reset instructions have been sent",
  };

  try {
    const limit = await checkRateLimit(
      authRateLimit,
      `forgot-password:${getRateLimitIdentifier(req)}`,
    );

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const body = await req.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return apiSuccess(genericResponse);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      include: { profile: true },
    });

    if (!user) {
      return apiSuccess(genericResponse);
    }

    const token = generateToken(32);

    await prisma.$transaction([
      prisma.verificationToken.updateMany({
        where: {
          userId: user.id,
          type: "password_reset",
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      prisma.verificationToken.create({
        data: {
          userId: user.id,
          token,
          type: "password_reset",
          expiresAt: addHours(new Date(), 1),
        },
      }),
    ]);

    await sendPasswordResetEmail(user.email, token, parsed.data.locale);

    return apiSuccess(genericResponse);
  } catch (error) {
    return handleApiError(error);
  }
}
