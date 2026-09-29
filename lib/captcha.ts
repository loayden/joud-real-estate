import { HttpError } from "@/lib/api-response";
import { isHcaptchaConfigured, verifyHcaptchaToken } from "@/lib/hcaptcha";

export type CaptchaProvider = "hcaptcha" | "turnstile" | "none";

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isUsableKey(value: string | undefined): value is string {
  return Boolean(value && !value.includes("xxx") && !value.includes("test"));
}

// Priority: hCaptcha (existing behavior) -> Turnstile (free alternative)
// -> none (registration/inquiry stay usable; rate limits + email
// verification remain as backstops). Adding either provider's keys in
// Vercel activates it with no code change and no redeploy of logic.
export function getCaptchaProvider(): CaptchaProvider {
  if (isHcaptchaConfigured()) return "hcaptcha";
  if (isUsableKey(clean(process.env.TURNSTILE_SECRET_KEY))) {
    return "turnstile";
  }
  return "none";
}

export function getCaptchaSiteKey(): {
  provider: CaptchaProvider;
  siteKey?: string;
} {
  const hcaptchaKey = clean(process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);
  if (isHcaptchaConfigured() && isUsableKey(hcaptchaKey)) {
    return { provider: "hcaptcha", siteKey: hcaptchaKey };
  }
  const turnstileKey = clean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  if (isUsableKey(turnstileKey)) {
    return { provider: "turnstile", siteKey: turnstileKey };
  }
  return { provider: "none" };
}

async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string | null,
) {
  const secret = clean(process.env.TURNSTILE_SECRET_KEY);

  if (!secret) {
    return;
  }

  if (!token) {
    throw new HttpError("Captcha verification failed", 400, "CAPTCHA_REQUIRED");
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  let response: Response;
  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
      },
    );
  } catch {
    throw new HttpError(
      "Captcha verification unavailable",
      503,
      "CAPTCHA_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    throw new HttpError(
      "Captcha verification unavailable",
      503,
      "CAPTCHA_UNAVAILABLE",
    );
  }

  const payload = (await response.json()) as { success?: boolean };

  if (!payload.success) {
    throw new HttpError("Captcha verification failed", 400, "CAPTCHA_FAILED");
  }
}

let noneModeWarned = false;

export async function verifyCaptchaToken(
  token: string | undefined,
  remoteIp?: string | null,
) {
  const provider = getCaptchaProvider();

  if (provider === "hcaptcha") {
    await verifyHcaptchaToken(token, remoteIp);
    return;
  }

  if (provider === "turnstile") {
    await verifyTurnstileToken(token, remoteIp);
    return;
  }

  if (!noneModeWarned) {
    noneModeWarned = true;
    console.warn(
      "Captcha provider not configured — skipping verification. " +
        "Set HCAPTCHA_SECRET or TURNSTILE_SECRET_KEY in Vercel to enable bot protection.",
    );
  }
}
