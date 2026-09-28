"use client";

import { Bookmark, CheckCircle2, Loader2, LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, type Locale, usePathname, useRouter } from "@/i18n/routing";
import { apiFetch } from "@/lib/api-client";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const copy = {
  ar: {
    save: "حفظ البحث",
    title: "حفظ هذا البحث",
    description: "احفظ الفلاتر الحالية باسم واضح لتعود إلى نفس النتائج لاحقاً.",
    name: "اسم البحث",
    namePlaceholder: "مثال: فلل للبيع في سكاكا",
    submit: "حفظ",
    saving: "جار الحفظ",
    success: "تم حفظ البحث.",
    empty: "أضف كلمة بحث أو فلتر واحد على الأقل قبل الحفظ.",
    loginTitle: "سجّل الدخول لحفظ البحث",
    loginDescription: "تحتاج إلى حساب لحفظ عمليات البحث والرجوع إليها.",
    login: "تسجيل الدخول",
    genericError: "تعذر حفظ البحث. حاول مرة أخرى.",
  },
  en: {
    save: "Save search",
    title: "Save this search",
    description:
      "Save the current filters with a clear name so you can return later.",
    name: "Search name",
    namePlaceholder: "Example: Villas for sale in Sakaka",
    submit: "Save",
    saving: "Saving",
    success: "Search saved.",
    empty: "Add at least one keyword or filter before saving.",
    loginTitle: "Sign in to save searches",
    loginDescription: "You need an account to save and revisit searches.",
    login: "Sign in",
    genericError: "Could not save the search. Try again.",
  },
} as const;

const ignoredKeys = new Set(["page", "limit"]);

function buildFilters(searchParams: URLSearchParams) {
  const filters: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (!ignoredKeys.has(key) && value.trim()) {
      filters[key] = value.trim();
    }
  }

  return filters;
}

function loginHref(locale: Locale, pathname: string, query: string) {
  const callbackUrl = `/${locale}${pathname}${query ? `?${query}` : ""}`;
  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function SaveSearchButton({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const filters = useMemo(() => buildFilters(searchParams), [searchParams]);
  const hasFilters = Object.keys(filters).length > 0;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!hasFilters) {
      setMessage({ type: "error", text: text.empty });
      return;
    }

    const formData = new FormData(form);
    const nameAr = String(formData.get("nameAr") ?? "").trim();

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await apiFetch("/api/saved-searches", {
        body: JSON.stringify({ nameAr, filters }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse<{
        id: string;
      }> | null;

      if (response.status === 401 || response.status === 403) {
        setIsOpen(false);
        setIsLoginOpen(true);
        return;
      }

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload && !payload.success ? payload.error : text.genericError,
        );
      }

      form.reset();
      setMessage({ type: "success", text: text.success });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : text.genericError,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="secondary">
            <Bookmark className="size-4" />
            {text.save}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader className="mb-5">
            <SheetTitle>{text.title}</SheetTitle>
            <SheetDescription>{text.description}</SheetDescription>
          </SheetHeader>
          <form className="grid gap-5" onSubmit={submit}>
            {message ? (
              <Alert
                variant={message.type === "success" ? "success" : "destructive"}
              >
                <span className="inline-flex items-center gap-2">
                  {message.type === "success" ? (
                    <CheckCircle2 className="size-4" />
                  ) : null}
                  {message.text}
                </span>
              </Alert>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="saved-search-name">{text.name}</Label>
              <Input
                id="saved-search-name"
                maxLength={200}
                name="nameAr"
                placeholder={text.namePlaceholder}
                required
              />
            </div>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {text.saving}
                </>
              ) : (
                <>
                  <Bookmark className="size-4" />
                  {text.submit}
                </>
              )}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

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
    </>
  );
}
