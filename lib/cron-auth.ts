import type { NextRequest } from "next/server";

import { HttpError } from "@/lib/api-response";

export function requireCronSecret(req: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret || configuredSecret.includes("replace-with")) {
    throw new HttpError(
      "Cron secret is not configured",
      503,
      "CRON_UNCONFIGURED",
    );
  }

  const authorization = req.headers.get("authorization");
  const expected = `Bearer ${configuredSecret}`;

  if (authorization !== expected) {
    throw new HttpError("Unauthorized", 401, "UNAUTHORIZED");
  }
}
