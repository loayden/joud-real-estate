import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyEmailStatus } from "@/components/auth/VerifyEmailStatus";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { title: "تفعيل البريد الإلكتروني" },
  en: { title: "Verify Email" },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].title,
    robots: { index: false, follow: false },
  };
}

export default function VerifyEmailPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { token?: string | string[] };
}) {
  const token =
    typeof searchParams.token === "string" ? searchParams.token : undefined;

  return (
    <AuthShell locale={locale}>
      <VerifyEmailStatus locale={locale} token={token} />
    </AuthShell>
  );
}
