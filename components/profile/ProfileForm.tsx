"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { AvatarUploader } from "@/components/shared/AvatarUploader";
import { RegionCitySelect } from "@/components/shared/RegionCitySelect";
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
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/routing";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { apiFetch } from "@/lib/api-client";

type ProfileFormValues = z.input<typeof profileUpdateSchema>;

type Profile = {
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string;
  whatsapp: string;
  preferredLocale: string;
  cityId: string;
  city: {
    id: string;
    regionId: string;
    nameAr: string;
    nameEn: string;
    slug: string;
  } | null;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const copy = {
  ar: {
    title: "الملف الشخصي",
    description: "حدّث معلومات التواصل والنبذة التي تظهر في حسابك.",
    avatarUpload: "رفع الصورة",
    avatarHelp:
      "JPEG أو PNG أو WebP. الحد الأقصى 2MB. يتم تحويل الصورة إلى WebP بقياس 200×200.",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    phone: "رقم الجوال",
    whatsapp: "واتساب",
    city: "المدينة",
    bio: "نبذة مختصرة",
    save: "حفظ التغييرات",
    saving: "جار الحفظ",
    success: "تم تحديث الملف الشخصي.",
    genericError: "تعذر تحديث الملف الشخصي.",
  },
  en: {
    title: "Profile",
    description: "Update the contact details and bio shown on your account.",
    avatarUpload: "Upload avatar",
    avatarHelp:
      "JPEG, PNG, or WebP. Max 2MB. The image is converted to 200×200 WebP.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    whatsapp: "WhatsApp",
    city: "City",
    bio: "Bio",
    save: "Save changes",
    saving: "Saving",
    success: "Profile updated.",
    genericError: "Could not update profile.",
  },
} as const;

export function ProfileForm({
  locale,
  profile,
}: {
  locale: Locale;
  profile: Profile;
}) {
  const text = copy[locale];
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fallbackText = useMemo(() => {
    const initials = `${profile.firstName.at(0) ?? ""}${profile.lastName.at(0) ?? ""}`;
    return initials || profile.email.at(0)?.toUpperCase() || "U";
  }, [profile.email, profile.firstName, profile.lastName]);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      bio: profile.bio ?? "",
      preferredLocale:
        profile.preferredLocale === "en" || profile.preferredLocale === "ar"
          ? profile.preferredLocale
          : locale,
      cityId: profile.cityId ?? "",
    },
  });
  const handleLocationChange = useCallback(
    (_region: unknown, city: { id: string } | null) => {
      setValue("cityId", city?.id ?? "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  async function onSubmit(values: ProfileFormValues) {
    setStatus(null);

    const response = await apiFetch("/api/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response
      .json()
      .catch(() => null)) as ApiResponse<Profile> | null;

    if (!response.ok || !payload || !payload.success) {
      setStatus({
        type: "error",
        message:
          payload && "error" in payload ? payload.error : text.genericError,
      });
      return;
    }

    setAvatarUrl(payload.data.avatarUrl);
    setStatus({ type: "success", message: text.success });
    window.dispatchEvent(new Event("joud:user-updated"));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <AvatarUploader
          currentUrl={avatarUrl}
          fallbackText={fallbackText}
          helpText={text.avatarHelp}
          onUpload={(url) => {
            setAvatarUrl(url);
            window.dispatchEvent(new Event("joud:user-updated"));
            router.refresh();
          }}
          uploadLabel={text.avatarUpload}
        />

        <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          {status ? (
            <Alert
              variant={status.type === "success" ? "success" : "destructive"}
            >
              {status.message}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">{text.firstName}</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName ? (
                <p className="text-sm text-red-700">
                  {errors.firstName.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">{text.lastName}</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName ? (
                <p className="text-sm text-red-700">
                  {errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">{text.email}</Label>
              <Input disabled id="email" value={profile.email} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{text.phone}</Label>
              <Input id="phone" inputMode="tel" {...register("phone")} />
              {errors.phone ? (
                <p className="text-sm text-red-700">{errors.phone.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="whatsapp">{text.whatsapp}</Label>
            <Input id="whatsapp" inputMode="tel" {...register("whatsapp")} />
            {errors.whatsapp ? (
              <p className="text-sm text-red-700">{errors.whatsapp.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>{text.city}</Label>
            <RegionCitySelect
              cityId={profile.cityId || undefined}
              onChange={handleLocationChange}
              regionId={profile.city?.regionId}
              showNeighborhood={false}
            />
            {errors.cityId ? (
              <p className="text-sm text-red-700">{errors.cityId.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">{text.bio}</Label>
            <Textarea id="bio" {...register("bio")} />
            {errors.bio ? (
              <p className="text-sm text-red-700">{errors.bio.message}</p>
            ) : null}
          </div>

          <input type="hidden" {...register("preferredLocale")} />
          <input type="hidden" {...register("cityId")} />

          <Button
            className="w-full sm:w-fit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSubmitting ? text.saving : text.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
