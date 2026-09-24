"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useEffect, useRef } from "react";

import type { Locale } from "@/i18n/routing";

type CaptchaWidgetProps = {
  locale: Locale;
  onExpire?: () => void;
  onVerify: (token: string) => void;
  resetSignal?: number;
};

function isUsableSiteKey(value: string | undefined): value is string {
  return Boolean(value && !value.includes("xxx") && !value.includes("test"));
}

export function CaptchaWidget({
  locale,
  onExpire,
  onVerify,
  resetSignal = 0,
}: CaptchaWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    if (resetSignal > 0) {
      captchaRef.current?.resetCaptcha();
    }
  }, [resetSignal]);

  if (!isUsableSiteKey(siteKey)) return null;

  return (
    <div className="overflow-hidden rounded-md border border-border p-3">
      <HCaptcha
        languageOverride={locale}
        onExpire={() => {
          captchaRef.current?.resetCaptcha();
          onExpire?.();
        }}
        onVerify={onVerify}
        ref={captchaRef}
        sitekey={siteKey}
      />
    </div>
  );
}
