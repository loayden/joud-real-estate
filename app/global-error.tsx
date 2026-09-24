"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

const copy = {
  ar: {
    title: "حدث خطأ غير متوقع",
    description:
      "تم تسجيل الخطأ للمراجعة. يمكنك المحاولة مرة أخرى أو العودة لاحقاً.",
    retry: "حاول مرة أخرى",
  },
  en: {
    title: "An unexpected error occurred",
    description:
      "The error has been logged. You can try again or come back later.",
    retry: "Try again",
  },
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<"ar" | "en">("ar");

  useEffect(() => {
    const lang = navigator.language ?? "";
    setLocale(lang.startsWith("ar") ? "ar" : "en");
  }, []);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const text = copy[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html dir={dir} lang={locale === "ar" ? "ar-EG" : "en"}>
      <body style={{ margin: 0 }}>
        <main
          style={{
            alignItems: "center",
            boxSizing: "border-box",
            color: "#0D2444",
            display: "flex",
            fontFamily:
              locale === "ar"
                ? "Tahoma, Arial, sans-serif"
                : "Inter, Arial, sans-serif",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "640px" }}>
            <p
              style={{
                color: "#D4A017",
                fontSize: "14px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              500
            </p>
            <h1 style={{ fontSize: "32px", margin: "12px 0 0" }}>
              {text.title}
            </h1>
            <p
              style={{
                color: "#526070",
                fontSize: "16px",
                lineHeight: 1.8,
                margin: "16px 0 0",
              }}
            >
              {text.description}
            </p>
            <button
              onClick={reset}
              style={{
                background: "#1B4B8A",
                border: 0,
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
                font: "inherit",
                fontWeight: 700,
                marginTop: "32px",
                padding: "12px 18px",
              }}
              type="button"
            >
              {text.retry}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
