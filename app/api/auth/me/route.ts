import { apiSuccess, handleApiError, HttpError } from "@/lib/api-response";
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
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            preferredLocale: true,
          },
        },
      },
    });

    if (!user) {
      return apiSuccess(null);
    }

    return apiSuccess({
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      preferredLocale: user.profile?.preferredLocale ?? "ar",
    });
  } catch (error) {
    if (error instanceof HttpError && error.code === "UNAUTHORIZED") {
      return apiSuccess(null);
    }
    return handleApiError(error);
  }
}
