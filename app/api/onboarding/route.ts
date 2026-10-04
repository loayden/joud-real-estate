import { NextResponse } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingCompletedAt: true,
        profile: { select: { firstName: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    return apiSuccess({
      completed: user.onboardingCompletedAt !== null,
      firstName: user.profile?.firstName ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const session = await requireSession();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompletedAt: new Date() },
    });

    return apiSuccess({ completed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
