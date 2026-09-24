import { MailCheck } from "lucide-react";
import type { Metadata } from "next";

import { EmailPreviewConsole } from "@/components/admin/EmailPreviewConsole";
import type { Locale } from "@/i18n/routing";
import {
  emailTemplateDefinitions,
  renderEmailTemplatePreview,
} from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    pageTitle: "معاينة رسائل البريد | جود العقارية",
    title: "معاينة رسائل البريد",
    description:
      "راجع قوالب البريد المعتمدة للمنصة باللغتين العربية والإنجليزية قبل تفعيل أو اختبار الإرسال الحقيقي.",
  },
  en: {
    pageTitle: "Email Preview | Joud Real Estate",
    title: "Email Template Preview",
    description:
      "Review production email templates in Arabic and English before enabling or testing live delivery.",
  },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].pageTitle,
  };
}

export default function AdminEmailsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const initialTemplate = emailTemplateDefinitions[0];
  const rendered = renderEmailTemplatePreview(initialTemplate.key, locale);
  const initialPreview = {
    ...initialTemplate,
    locale,
    subject: rendered.subject,
    html: rendered.html,
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="flex items-center gap-3 text-3xl font-bold tracking-normal text-foreground">
          <MailCheck className="size-7 text-primary" />
          {text.title}
        </h2>
        <p className="max-w-3xl text-muted-foreground">{text.description}</p>
      </div>

      <EmailPreviewConsole
        initialPreview={initialPreview}
        locale={locale}
        templates={emailTemplateDefinitions}
      />
    </div>
  );
}
