import type { UserRole } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

import { HttpError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function getAuthFromRequest(req: NextRequest) {
  return getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });
}

export async function requireV1Auth(req: NextRequest) {
  const token = await getAuthFromRequest(req);
  const userId = typeof token?.id === "string" ? token.id : token?.sub;

  if (!userId) {
    throw new HttpError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new HttpError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return user;
}

export async function requireV1Role(req: NextRequest, roles: UserRole[]) {
  const user = await requireV1Auth(req);

  if (!roles.includes(user.role)) {
    throw new HttpError("Forbidden", 403, "FORBIDDEN");
  }

  return user;
}
