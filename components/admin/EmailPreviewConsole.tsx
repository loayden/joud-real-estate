"use client";

import { Eye, Languages, Mail, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Locale = "ar" | "en";

type TemplateDefinition = {
  key: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

type EmailPreview = TemplateDefinition & {
  locale: Locale;
  subject: string;
  html: string;
};

const copy = {
  ar: {
    templates: "القوالب",
    language: "لغة المعاينة",
    subject: "عنوان البريد",
    preview: "المعاينة",
    refresh: "تحديث المعاينة",
    loading: "جار تحميل المعاينة...",
    error: "تعذر تحميل قالب البريد. حاول مرة أخرى.",
    sandboxNote:
      "تُعرض المعاينة داخل إطار معزول بدون سكربتات لتقليل مخاطر معاينة HTML.",
  },
  en: {
    templates: "Templates",
    language: "Preview language",
    subject: "Email subject",
    preview: "Preview",
    refresh: "Refresh preview",
    loading: "Loading preview...",
    error: "Could not load the email template. Try again.",
    sandboxNote:
      "Preview renders in a sandboxed iframe without scripts to reduce HTML preview risk.",
  },
} as const;

async function loadPreview(templateKey: string, locale: Locale) {
  const response = await fetch(
    `/api/admin/emails/preview/${templateKey}?locale=${locale}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!response.ok) {
    throw new Error(`Preview request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    success: boolean;
    data?: EmailPreview;
  };

  if (!payload.success || !payload.data) {
    throw new Error("Preview response was not successful");
  }

  return payload.data;
}

export function EmailPreviewConsole({
  initialPreview,
  locale,
  templates,
}: {
  initialPreview: EmailPreview;
  locale: Locale;
  templates: TemplateDefinition[];
}) {
  const text = copy[locale];
  const [selectedTemplate, setSelectedTemplate] = useState(initialPreview.key);
  const [previewLocale, setPreviewLocale] = useState<Locale>(locale);
  const [preview, setPreview] = useState(initialPreview);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const selectedDefinition = useMemo(
    () =>
      templates.find((template) => template.key === selectedTemplate) ??
      templates[0],
    [selectedTemplate, templates],
  );

  async function refreshPreview(
    templateKey = selectedTemplate,
    nextLocale = previewLocale,
  ) {
    setSelectedTemplate(templateKey);
    setPreviewLocale(nextLocale);
    setError(null);
    setIsLoading(true);

    try {
      setPreview(await loadPreview(templateKey, nextLocale));
    } catch {
      setError(text.error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Mail className="size-5 text-primary" />
            {text.templates}
          </CardTitle>
          <CardDescription>{text.sandboxNote}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Languages className="size-4 text-primary" />
              {text.language}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["ar", "en"] as const).map((nextLocale) => (
                <Button
                  key={nextLocale}
                  onClick={() => refreshPreview(selectedTemplate, nextLocale)}
                  type="button"
                  variant={
                    previewLocale === nextLocale ? "default" : "secondary"
                  }
                >
                  {nextLocale.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            {templates.map((template) => {
              const active = selectedTemplate === template.key;

              return (
                <button
                  className={cn(
                    "rounded-md border p-3 text-start transition-colors",
                    active
                      ? "border-primary bg-primary-50 text-primary-900"
                      : "border-border bg-background hover:bg-muted",
                  )}
                  key={template.key}
                  onClick={() => refreshPreview(template.key, previewLocale)}
                  type="button"
                >
                  <span className="block font-bold">
                    {locale === "ar" ? template.labelAr : template.labelEn}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    {locale === "ar"
                      ? template.descriptionAr
                      : template.descriptionEn}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Eye className="size-5 text-primary" />
                {locale === "ar"
                  ? selectedDefinition.labelAr
                  : selectedDefinition.labelEn}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? selectedDefinition.descriptionAr
                  : selectedDefinition.descriptionEn}
              </CardDescription>
            </div>
            <Button
              disabled={isLoading}
              onClick={() => refreshPreview()}
              type="button"
              variant="secondary"
            >
              <RefreshCw
                className={cn("size-4", isLoading ? "animate-spin" : "")}
              />
              {text.refresh}
            </Button>
          </div>

          <div className="rounded-md border border-border bg-muted/50 px-4 py-3">
            <span className="block text-xs font-bold uppercase text-muted-foreground">
              {text.subject}
            </span>
            <span className="mt-1 block font-bold text-foreground">
              {preview.subject}
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error ? <Alert variant="destructive">{error}</Alert> : null}
          {isLoading ? (
            <Alert>{text.loading}</Alert>
          ) : (
            <div className="overflow-hidden rounded-md border border-border bg-muted">
              <iframe
                className="h-[720px] w-full bg-white"
                sandbox=""
                srcDoc={preview.html}
                title={text.preview}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
