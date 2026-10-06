import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { title: "استعادة كلمة المرور" },
  en: { title: "Reset Password" },
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

export default function ForgotPasswordPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  return (
    <AuthShell locale={locale}>
      <ForgotPasswordForm locale={locale} />
    </AuthShell>
  );
}
