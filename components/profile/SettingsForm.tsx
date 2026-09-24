"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, Save } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/routing";
import {
  passwordChangeSchema,
  type PasswordChangeInput,
} from "@/lib/validations/profile";

type Profile = {
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string;
  whatsapp: string;
  preferredLocale: string;
  cityId: string;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const copy = {
  ar: {
    securityTitle: "الأمان",
    securityDescription: "غيّر كلمة مرور حسابك بعد تأكيد كلمة المرور الحالية.",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    updatePassword: "تحديث كلمة المرور",
    updatingPassword: "جار التحديث",
    passwordSuccess: "تم تحديث كلمة المرور.",
    passwordError: "تعذر تحديث كلمة المرور.",
    localeTitle: "تفضيل اللغة",
    localeDescription: "اختر اللغة الافتراضية لتجربة الحساب.",
    language: "اللغة",
    saveLanguage: "حفظ اللغة",
    savingLanguage: "جار الحفظ",
    languageSuccess: "تم تحديث تفضيل اللغة.",
    languageError: "تعذر تحديث تفضيل اللغة.",
    ar: "العربية",
    en: "English",
  },
  en: {
    securityTitle: "Security",
    securityDescription:
      "Change your account password after confirming the current password.",
    currentPassword: "Current password",
    newPassword: "New password",
    updatePassword: "Update password",
    updatingPassword: "Updating",
    passwordSuccess: "Password updated.",
    passwordError: "Could not update password.",
    localeTitle: "Language Preference",
    localeDescription:
      "Choose the default language for your account experience.",
    language: "Language",
    saveLanguage: "Save language",
    savingLanguage: "Saving",
    languageSuccess: "Language preference updated.",
    languageError: "Could not update language preference.",
    ar: "العربية",
    en: "English",
  },
} as const;

export function SettingsForm({
  locale,
  profile,
}: {
  locale: Locale;
  profile: Profile;
}) {
  const text = copy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState<Locale>(
    profile.preferredLocale === "en" ? "en" : "ar",
  );
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [languageStatus, setLanguageStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onPasswordSubmit(values: PasswordChangeInput) {
    setPasswordStatus(null);

    const response = await fetch("/api/users/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as ApiResponse<{
      changed: boolean;
    }>;

    if (!response.ok || !payload.success) {
      setPasswordStatus({
        type: "error",
        message: payload.success ? text.passwordError : payload.error,
      });
      return;
    }

    reset();
    setPasswordStatus({ type: "success", message: text.passwordSuccess });
  }

  async function saveLanguage() {
    setIsSavingLanguage(true);
    setLanguageStatus(null);

    const response = await fetch("/api/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        whatsapp: profile.whatsapp ?? "",
        cityId: profile.cityId ?? "",
        preferredLocale: language,
      }),
    });
    const payload = (await response.json()) as ApiResponse<Profile>;

    setIsSavingLanguage(false);

    if (!response.ok || !payload.success) {
      setLanguageStatus({
        type: "error",
        message: payload.success ? text.languageError : payload.error,
      });
      return;
    }

    setLanguageStatus({ type: "success", message: text.languageSuccess });

    if (language !== locale) {
      router.replace(pathname, { locale: language });
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{text.securityTitle}</CardTitle>
          <CardDescription>{text.securityDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-5"
            onSubmit={handleSubmit(onPasswordSubmit)}
          >
            {passwordStatus ? (
              <Alert
                variant={
                  passwordStatus.type === "success" ? "success" : "destructive"
                }
              >
                {passwordStatus.message}
              </Alert>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="currentPassword">{text.currentPassword}</Label>
              <Input
                autoComplete="current-password"
                id="currentPassword"
                type="password"
                {...register("currentPassword")}
              />
              {errors.currentPassword ? (
                <p className="text-sm text-red-700">
                  {errors.currentPassword.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword">{text.newPassword}</Label>
              <Input
                autoComplete="new-password"
                id="newPassword"
                type="password"
                {...register("newPassword")}
              />
              {errors.newPassword ? (
                <p className="text-sm text-red-700">
                  {errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <Button
              className="w-full sm:w-fit"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              {isSubmitting ? text.updatingPassword : text.updatePassword}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{text.localeTitle}</CardTitle>
          <CardDescription>{text.localeDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {languageStatus ? (
            <Alert
              variant={
                languageStatus.type === "success" ? "success" : "destructive"
              }
            >
              {languageStatus.message}
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="preferredLocale">{text.language}</Label>
            <select
              className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="preferredLocale"
              onChange={(event) => setLanguage(event.target.value as Locale)}
              value={language}
            >
              <option value="ar">{text.ar}</option>
              <option value="en">{text.en}</option>
            </select>
          </div>

          <Button
            className="w-full sm:w-fit"
            disabled={isSavingLanguage}
            onClick={() => void saveLanguage()}
            type="button"
          >
            {isSavingLanguage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSavingLanguage ? text.savingLanguage : text.saveLanguage}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
