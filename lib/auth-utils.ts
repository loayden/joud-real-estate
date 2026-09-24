import crypto from "crypto";

import type { UserRole } from "@prisma/client";

import { auth } from "@/lib/auth";
import { HttpError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new HttpError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      profile: { select: { firstName: true } },
    },
  });

  if (!user) {
    throw new HttpError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (user.status !== "ACTIVE") {
    throw new HttpError("Account is not active", 403, "ACCOUNT_INACTIVE");
  }

  session.user.id = user.id;
  session.user.email = user.email;
  session.user.role = user.role;
  session.user.name = user.profile?.firstName ?? user.email;

  return session;
}

export async function requireRole(roles: UserRole[]) {
  const session = await requireSession();

  if (!roles.includes(session.user.role as UserRole)) {
    throw new HttpError("Forbidden", 403, "FORBIDDEN");
  }

  return session;
}
