import { AuthError } from "next-auth";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { generateToken } from "@/lib/auth-utils";
import { getCredentialsErrorMessage, signIn } from "@/lib/auth";
import {
  buildVerificationUrl,
  shouldExposeDevelopmentEmailLinks,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  authRateLimit,
  checkRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAuthErrorCode(error: AuthError) {
  const cause = error.cause as { err?: { code?: string } } | undefined;
  return cause?.err?.code ?? (error as AuthError & { code?: string }).code;
}

function safeRedirectPath(value: unknown) {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return "/dashboard";
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function getLocale(value: unknown) {
  return value === "en" ? "en" : "ar";
}

async function getOrCreateEmailVerificationToken(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  const existingToken = await prisma.verificationToken.findFirst({
    where: {
      userId: user.id,
      type: "email_verification",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { token: true },
  });

  if (existingToken) {
    return existingToken.token;
  }

  const token = generateToken(32);

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      type: "email_verification",
      expiresAt: addHours(new Date(), 24),
    },
  });

  return token;
}

export async function POST(req: NextRequest) {
  try {
    const limit = await checkRateLimit(
      authRateLimit,
      `login:${getRateLimitIdentifier(req)}`,
    );

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid email or password", 400, "VALIDATION_ERROR");
    }

    try {
      await signIn("credentials", {
        ...parsed.data,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        const code = getAuthErrorCode(error);
        const details: Record<string, unknown> = {};

        if (
          code === "email_unverified" &&
          shouldExposeDevelopmentEmailLinks()
        ) {
          const token = await getOrCreateEmailVerificationToken(
            parsed.data.email,
          );

          if (token) {
            details.devVerificationUrl = buildVerificationUrl(
              token,
              getLocale(body?.locale),
            );
          }
        }

        return apiError(
          getCredentialsErrorMessage(code),
          401,
          code ?? "INVALID_CREDENTIALS",
          Object.keys(details).length > 0 ? details : undefined,
        );
      }

      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return apiSuccess({
      user,
      redirectTo: safeRedirectPath(body?.callbackUrl),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
