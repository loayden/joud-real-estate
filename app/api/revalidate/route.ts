import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import {
  rateLimit,
  authRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_TAGS = [
  "properties",
  "property",
  "categories",
  "areas",
  "home",
  "search",
  "agents",
  "developers",
  "compounds",
];

const ALLOWED_PATHS = [
  "/",
  "/properties",
  "/search",
  "/about",
  "/contact",
  "/mortgage",
  "/compounds",
  "/agents",
  "/developers",
];

function isConfiguredSecret(value: string | undefined) {
  return Boolean(value && value.length >= 16 && !value.includes("xxx"));
}

export async function POST(req: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(req);
    await rateLimit(authRateLimit, `revalidate:${identifier}`);

    const secret = req.headers.get("x-revalidate-secret");

    if (
      !isConfiguredSecret(process.env.REVALIDATE_SECRET) ||
      secret !== process.env.REVALIDATE_SECRET
    ) {
      return apiError("Invalid revalidation secret", 401, "INVALID_SECRET");
    }

    const body = await req.json().catch(() => ({}));
    const tag = body.tag as string | undefined;
    const path = body.path as string | undefined;

    if (!tag && !path) {
      return apiError(
        "A tag or path is required",
        400,
        "REVALIDATION_TARGET_REQUIRED",
      );
    }

    if (tag && !ALLOWED_TAGS.includes(tag)) {
      return apiError(
        `Invalid tag. Allowed: ${ALLOWED_TAGS.join(", ")}`,
        400,
        "INVALID_TAG",
      );
    }

    if (
      path &&
      !ALLOWED_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
    ) {
      return apiError(
        `Invalid path. Allowed prefixes: ${ALLOWED_PATHS.join(", ")}`,
        400,
        "INVALID_PATH",
      );
    }

    if (tag) {
      revalidateTag(tag);
    }

    if (path) {
      revalidatePath(path);
    }

    return apiSuccess({ revalidated: true, tag, path });
  } catch (error) {
    return handleApiError(error);
  }
}
