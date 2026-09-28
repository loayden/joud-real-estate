import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

import { defaultLocale, locales, routing } from "./i18n/routing";
import {
  validateCsrfToken,
  getCsrfHeaderToken,
  getCsrfCookieToken,
} from "@/lib/csrf";

const intlMiddleware = createMiddleware(routing);
const allowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const allowedHeaders =
  "Authorization, Content-Type, X-Requested-With, X-CSRF-Token";

const hcaptchaSources = "https://hcaptcha.com https://*.hcaptcha.com";
const sentryIngestSources =
  "https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.sentry.io";
const pexelsImageSources = "https://images.pexels.com";
const youtubeFrameSources =
  "https://www.youtube.com https://www.youtube-nocookie.com";
const devScriptSources =
  process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_EXEMPT_PATHS = ["/api/auth/", "/api/health", "/api/revalidate"];

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((path) => pathname.startsWith(path));
}

const protectedDashboardRoots = [
  "/dashboard",
  "/my-listings",
  "/favorites",
  "/saved-searches",
  "/inquiries",
  "/profile",
  "/settings",
];

function getLocaleFromPath(pathname: string) {
  return (
    locales.find(
      (locale) =>
        pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
    ) ?? defaultLocale
  );
}

function stripLocale(pathname: string, locale: string) {
  const stripped = pathname.replace(new RegExp(`^/${locale}`), "");
  return stripped || "/";
}

function startsWithRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function redirectToLogin(req: NextRequest, locale: string) {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = `/${locale}/login`;
  loginUrl.search = "";
  loginUrl.searchParams.set(
    "callbackUrl",
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

function getAppOrigin() {
  // NB: `??` would keep an empty-string env var, which then throws in
  // `new URL("")`. Empty counts as missing.
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    ""
  ).trim();

  if (!appUrl) return null;

  try {
    return new URL(appUrl).origin;
  } catch {
    return null;
  }
}

function isLocalhostOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function isAllowedApiOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (!origin) {
    return true;
  }

  const appOrigin = getAppOrigin();

  if (appOrigin && origin === appOrigin) {
    return true;
  }

  if (
    appOrigin &&
    isLocalhostOrigin(appOrigin) &&
    isLocalhostOrigin(origin) &&
    isLocalhostOrigin(req.nextUrl.origin)
  ) {
    return true;
  }

  return false;
}

function applyCorsHeaders(req: NextRequest, response: NextResponse) {
  const origin = req.headers.get("origin");
  const appOrigin = getAppOrigin();

  const allowedOrigin =
    origin && isAllowedApiOrigin(req) && appOrigin
      ? appOrigin
      : (appOrigin ?? origin);

  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  }

  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", allowedMethods);
  response.headers.set("Access-Control-Allow-Headers", allowedHeaders);
  response.headers.set("Vary", "Origin");

  return response;
}

function buildCsp(): string {
  // NOTE: script-src/style-src keep 'unsafe-inline' because Next.js App
  // Router inlines critical scripts/styles at render time and does not
  // support per-request nonces from middleware. A nonce-only policy breaks
  // the app's own rendering (verified: 22 CSP console errors/page). XSS
  // defense instead relies on: React auto-escaping, DOMPurify sanitization
  // on all user HTML inputs, HttpOnly+SameSite=Strict session cookies,
  // and CSRF double-submit tokens. The remaining directives still confine
  // exfiltration, framing, plugins, and navigation.
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${devScriptSources} ${hcaptchaSources}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' https://images.joud.sa ${pexelsImageSources} data: blob:`,
    "font-src 'self' https://fonts.gstatic.com data:",
    `connect-src 'self' https://api.resend.com ${hcaptchaSources} ${sentryIngestSources}`,
    `frame-src ${hcaptchaSources} ${youtubeFrameSources}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

const STATIC_CSP = buildCsp();

function withCsp(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", STATIC_CSP);
  return response;
}

export default async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    if (!isAllowedApiOrigin(req)) {
      return withCsp(
        NextResponse.json(
          {
            success: false,
            error: "Forbidden origin",
            code: "FORBIDDEN_ORIGIN",
          },
          { status: 403 },
        ),
      );
    }

    if (req.method === "OPTIONS") {
      return withCsp(
        applyCorsHeaders(req, new NextResponse(null, { status: 204 })),
      );
    }

    if (
      MUTATING_METHODS.has(req.method) &&
      !isCsrfExempt(req.nextUrl.pathname)
    ) {
      const headerToken = getCsrfHeaderToken(req);
      const cookieToken = getCsrfCookieToken(req);
      if (!validateCsrfToken(headerToken, cookieToken)) {
        return withCsp(
          NextResponse.json(
            {
              success: false,
              error: "Invalid CSRF token",
              code: "CSRF_INVALID",
            },
            { status: 403 },
          ),
        );
      }
    }

    return withCsp(applyCorsHeaders(req, NextResponse.next()));
  }

  if (req.nextUrl.pathname === "/offline") {
    return withCsp(NextResponse.next());
  }

  const locale = getLocaleFromPath(req.nextUrl.pathname);
  const hasLocalePrefix = locales.some(
    (item) =>
      req.nextUrl.pathname === `/${item}` ||
      req.nextUrl.pathname.startsWith(`/${item}/`),
  );
  const pathnameWithoutLocale = stripLocale(req.nextUrl.pathname, locale);
  const requiresDashboardAuth = protectedDashboardRoots.some((route) =>
    startsWithRoute(pathnameWithoutLocale, route),
  );
  const requiresAdmin = startsWithRoute(pathnameWithoutLocale, "/admin");

  if (requiresDashboardAuth || requiresAdmin) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      cookieName:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
    });

    if (!token) {
      return withCsp(redirectToLogin(req, locale));
    }

    if (
      requiresAdmin &&
      token.role !== "ADMIN" &&
      token.role !== "SUPER_ADMIN"
    ) {
      return withCsp(redirectToLogin(req, locale));
    }
  }

  if (hasLocalePrefix) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("X-NEXT-INTL-LOCALE", locale);

    return withCsp(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
    );
  }

  return withCsp(intlMiddleware(req) as NextResponse);
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next|.*\\..*).*)"],
};
