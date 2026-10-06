"use client";

import { Heart, Loader2, LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link, type Locale, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/components/shared/Toaster";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const copy = {
  ar: {
    add: "إضافة إلى المفضلة",
    remove: "إزالة من المفضلة",
    added: "تمت الإضافة إلى المفضلة",
    removed: "تمت الإزالة من المفضلة",
    loginTitle: "سجّل الدخول لحفظ العقارات",
    loginDescription:
      "أنشئ قائمة مفضلة خاصة بك وارجع للعقارات المهمة في أي وقت.",
    login: "تسجيل الدخول",
    genericError: "تعذر تحديث المفضلة. حاول مرة أخرى.",
  },
  en: {
    add: "Add to favorites",
    remove: "Remove from favorites",
    added: "Added to favorites",
    removed: "Removed from favorites",
    loginTitle: "Sign in to save properties",
    loginDescription:
      "Build your private favorites list and come back to important listings anytime.",
    login: "Sign in",
    genericError: "Could not update favorites. Try again.",
  },
} as const;

function loginHref(locale: Locale, pathname: string, query: string) {
  const callbackUrl = `/${locale}${pathname}${query ? `?${query}` : ""}`;
  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function FavoriteButton({
  propertyId,
  initialFavorited,
  locale,
  className,
  compact = false,
  withLabel = false,
  onFavoriteChange,
}: {
  propertyId: string;
  initialFavorited: boolean;
  locale: Locale;
  className?: string;
  compact?: boolean;
  withLabel?: boolean;
  onFavoriteChange?: (favorited: boolean) => void;
}) {
  const text = copy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const query = searchParams.toString();

  async function toggleFavorite() {
    if (isSaving) return;

    const previous = favorited;
    const optimistic = !previous;

    setIsSaving(true);
    setFavorited(optimistic);
    setError(null);
    onFavoriteChange?.(optimistic);

    try {
      const response = await apiFetch("/api/favorites", {
        body: JSON.stringify({ propertyId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse<{
        favorited: boolean;
      }> | null;

      if (response.status === 401 || response.status === 403) {
        setFavorited(previous);
        onFavoriteChange?.(previous);
        setIsLoginOpen(true);
        return;
      }

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload && !payload.success ? payload.error : text.genericError,
        );
      }

      setFavorited(payload.data.favorited);
      onFavoriteChange?.(payload.data.favorited);
      toast("success", payload.data.favorited ? text.added : text.removed);
      startTransition(() => router.refresh());
    } catch (favoriteError) {
      setFavorited(previous);
      onFavoriteChange?.(previous);
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : text.genericError,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        aria-label={favorited ? text.remove : text.add}
        aria-pressed={favorited}
        className={cn(
          "inline-flex items-center justify-center border border-white/75 bg-background/95 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          withLabel
            ? "h-10 gap-2 rounded-md px-4 text-sm font-semibold"
            : "rounded-full",
          compact ? "size-9" : !withLabel && "size-10",
          favorited &&
            "border-destructive/30 bg-destructive/10 text-destructive",
          className,
        )}
        disabled={isPending || isSaving}
        onClick={toggleFavorite}
        title={favorited ? text.remove : text.add}
        type="button"
      >
        {isPending || isSaving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Heart
            className={cn("size-5", favorited && "fill-current")}
            strokeWidth={2.4}
          />
        )}
        {withLabel ? <span>{favorited ? text.remove : text.add}</span> : null}
      </button>

      <Sheet open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <SheetContent>
          <SheetHeader className="mb-5">
            <SheetTitle>{text.loginTitle}</SheetTitle>
            <SheetDescription>{text.loginDescription}</SheetDescription>
          </SheetHeader>
          <div className="grid gap-5">
            <Button asChild>
              <Link href={loginHref(locale, pathname, query)}>
                <LogIn className="size-4" />
                {text.login}
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {error ? (
        <span className="text-xs text-destructive" role="status">
          {error}
        </span>
      ) : null}
    </>
  );
}
