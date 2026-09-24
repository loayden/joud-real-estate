import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
  authRateLimit,
  checkRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const limit = await checkRateLimit(
      authRateLimit,
      `reset-password:${getRateLimitIdentifier(req)}`,
    );

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid reset request", 400, "VALIDATION_ERROR");
    }

    const resetToken = await prisma.verificationToken.findFirst({
      where: {
        token: parsed.data.token,
        type: "password_reset",
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return apiError(
        "Reset token is invalid or expired",
        400,
        "INVALID_TOKEN",
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      }),
      prisma.verificationToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.userSession.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return apiSuccess({ reset: true });
  } catch (error) {
    return handleApiError(error);
  }
}
