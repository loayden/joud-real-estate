import type { Metadata } from "next";

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
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center px-4 py-12">
      <ForgotPasswordForm locale={locale} />
    </section>
  );
}
