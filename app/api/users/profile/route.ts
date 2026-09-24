import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sanitizeOptionalPlainText, sanitizePlainText } from "@/lib/sanitize";
import { getSafeUserProfile } from "@/lib/user-profile";
import { profileUpdateSchema } from "@/lib/validations/profile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await getSafeUserProfile(session.user.id);

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid profile data", 400, "VALIDATION_ERROR");
    }

    const sanitized = {
      ...parsed.data,
      firstName: sanitizePlainText(parsed.data.firstName),
      lastName: sanitizePlainText(parsed.data.lastName),
      bio: sanitizeOptionalPlainText(parsed.data.bio),
    };
    const sanitizedParsed = profileUpdateSchema.safeParse(sanitized);

    if (!sanitizedParsed.success) {
      return apiError("Invalid profile data", 400, "VALIDATION_ERROR");
    }

    const {
      phone,
      firstName,
      lastName,
      bio,
      whatsapp,
      preferredLocale,
      cityId,
    } = sanitizedParsed.data;

    if (phone) {
      const phoneOwner = await prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });

      if (phoneOwner && phoneOwner.id !== session.user.id) {
        return apiError("Phone is already registered", 409, "PHONE_EXISTS");
      }
    }

    if (cityId) {
      const city = await prisma.city.findFirst({
        where: { id: cityId, isActive: true },
        select: { id: true },
      });

      if (!city) {
        return apiError("City is not available", 400, "INVALID_CITY");
      }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { phone: phone ?? null },
      }),
      prisma.userProfile.upsert({
        where: { userId: session.user.id },
        update: {
          firstName,
          lastName,
          bio,
          whatsapp,
          preferredLocale,
          cityId,
        },
        create: {
          userId: session.user.id,
          firstName,
          lastName,
          bio,
          whatsapp,
          preferredLocale,
          cityId,
        },
      }),
    ]);

    const user = await getSafeUserProfile(session.user.id);
    return apiSuccess(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("Value already exists", 409, "UNIQUE_CONSTRAINT");
    }

    return handleApiError(error);
  }
}
