import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

class AccountBannedError extends CredentialsSignin {
  code = "account_banned";
}

class AccountLockedError extends CredentialsSignin {
  code = "account_locked";
}

class EmailUnverifiedError extends CredentialsSignin {
  code = "email_unverified";
}

class AccountInactiveError extends CredentialsSignin {
  code = "account_inactive";
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return (
    forwardedFor?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}

export function getCredentialsErrorMessage(code?: string | null) {
  switch (code) {
    case "account_banned":
      return "تم حظر حسابك";
    case "account_locked":
      return "الحساب مقفل مؤقتاً. حاول مرة أخرى لاحقاً";
    case "email_unverified":
      return "يرجى تفعيل البريد الإلكتروني قبل تسجيل الدخول";
    case "account_inactive":
      return "الحساب غير نشط";
    default:
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  }
}

export async function authorizeCredentials(
  credentials: Partial<Record<"email" | "password", unknown>>,
  request: Request,
) {
  const parsed = loginSchema.safeParse(credentials);

  if (!parsed.success) {
    return null;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) {
    return null;
  }

  if (user.status === "BANNED") {
    throw new AccountBannedError();
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AccountLockedError();
  }

  if (user.status === "INACTIVE") {
    throw new AccountInactiveError();
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    const nextFailedCount = user.failedLoginCount + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: { increment: 1 },
        lockedUntil: nextFailedCount >= 5 ? addMinutes(new Date(), 30) : null,
      },
    });

    return null;
  }

  if (!user.emailVerified) {
    throw new EmailUnverifiedError();
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lastLoginAt: new Date(),
      lastLoginIp: getRequestIp(request),
      lockedUntil: null,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.profile?.firstName ?? user.email,
    role: user.role,
  };
}

export const authConfig = {
  // Required on Vercel: requests arrive at preview/production hostnames that
  // never equal AUTH_URL exactly, and without this every auth() call throws
  // UntrustedHost (seen in production logs on /ar, /en, /ar/agents).
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  logger: {
    error(error) {
      if (
        error instanceof CredentialsSignin ||
        error.name === "CredentialsSignin"
      ) {
        return;
      }

      console.error(error);
    },
    warn(code) {
      console.warn(code);
    },
    debug(message, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.debug(message, metadata);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
