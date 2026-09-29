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

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

function isUsableSiteKey(value: string | undefined): value is string {
  return Boolean(value && !value.includes("xxx") && !value.includes("test"));
}

function loadTurnstileScript(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(script);
  });
}

function TurnstileWidget({
  locale,
  onExpire,
  onVerify,
  resetSignal = 0,
  siteKey,
}: CaptchaWidgetProps & { siteKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const verifyRef = useRef(onVerify);
  verifyRef.current = onVerify;

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          language: locale,
          callback: (token: string) => verifyRef.current(token),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => onExpire?.(),
        });
      })
      .catch(() => {
        // Script blocked/offline: leave the form usable; the server still
        // rate-limits and requires email verification.
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, locale]);

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  return <div ref={containerRef} />;
}

export function CaptchaWidget({
  locale,
  onExpire,
  onVerify,
  resetSignal = 0,
}: CaptchaWidgetProps) {
  const hcaptchaKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    if (isUsableSiteKey(hcaptchaKey) && resetSignal > 0) {
      captchaRef.current?.resetCaptcha();
    }
  }, [hcaptchaKey, resetSignal]);

  if (isUsableSiteKey(hcaptchaKey)) {
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
          sitekey={hcaptchaKey}
        />
      </div>
    );
  }

  if (isUsableSiteKey(turnstileKey)) {
    return (
      <div className="overflow-hidden rounded-md border border-border p-3">
        <TurnstileWidget
          locale={locale}
          onExpire={onExpire}
          onVerify={onVerify}
          resetSignal={resetSignal}
          siteKey={turnstileKey}
        />
      </div>
    );
  }

  return null;
}
