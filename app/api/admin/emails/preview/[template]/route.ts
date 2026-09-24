import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import {
  emailTemplateDefinitions,
  isEmailTemplateKey,
  renderEmailTemplatePreview,
} from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { template: string } },
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    if (!isEmailTemplateKey(params.template)) {
      return apiError("Email template not found", 404, "NOT_FOUND");
    }

    const locale =
      new URL(req.url).searchParams.get("locale") === "en" ? "en" : "ar";
    const definition = emailTemplateDefinitions.find(
      (template) => template.key === params.template,
    );
    const preview = renderEmailTemplatePreview(params.template, locale);

    return apiSuccess({
      ...definition,
      locale,
      subject: preview.subject,
      html: preview.html,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
