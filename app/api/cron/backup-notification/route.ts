import type { NextRequest } from "next/server";

import { apiSuccess, handleApiError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import { requireCronSecret } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    requireCronSecret(req);

    const executedAt = new Date().toISOString();

    await logAudit({
      action: "BACKUP_NOTIFICATION_CRON",
      entity: "System",
      metadata: {
        executedAt,
        workflow: ".github/workflows/backup.yml",
      },
    });

    return apiSuccess({
      message:
        "Backup workflow is managed by GitHub Actions. Verify the latest Daily Database Backup run.",
      workflow: ".github/workflows/backup.yml",
      executedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
