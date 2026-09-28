import { HttpError } from "@/lib/api-response";

function isPlaceholder(value: string | undefined) {
  if (!value) return true;
  const trimmed = value.trim();
  return !trimmed || trimmed.includes("xxx") || trimmed.includes("test");
}

export function isHcaptchaConfigured() {
  return !isPlaceholder(
    process.env.HCAPTCHA_SECRET || process.env.HCAPTCHA_SECRET_KEY,
  );
}

export function shouldRenderHcaptcha() {
  return !isPlaceholder(process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY?.trim());
}

export async function verifyHcaptchaToken(
  token: string | undefined,
  remoteIp?: string | null,
) {
  if (!isHcaptchaConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new HttpError(
        "hCaptcha is not configured",
        503,
        "HCAPTCHA_NOT_CONFIGURED",
      );
    }

    return;
  }

  if (!token) {
    throw new HttpError("Captcha verification failed", 400, "CAPTCHA_REQUIRED");
  }

  const secret = (
    process.env.HCAPTCHA_SECRET ||
    process.env.HCAPTCHA_SECRET_KEY ||
    ""
  ).trim();
  const params = new URLSearchParams();
  params.set("secret", secret!);
  params.set("response", token);
  if (remoteIp) params.set("remoteip", remoteIp);

  const response = await fetch("https://hcaptcha.com/siteverify", {
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

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
