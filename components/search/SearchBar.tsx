"use client";

import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, type Locale } from "@/i18n/routing";

const copy = {
  ar: {
    label: "ابحث عن عقار",
    placeholder: "ابحث بالمدينة، نوع العقار، أو الكلمات المفتاحية",
    submit: "بحث",
    clear: "مسح البحث",
  },
  en: {
    label: "Search properties",
    placeholder: "Search by city, property type, or keyword",
    submit: "Search",
    clear: "Clear search",
  },
} as const;

export function SearchBar({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  function navigate(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    const normalizedValue = nextValue.trim();

    if (normalizedValue) {
      params.set("q", normalizedValue);
    } else {
      params.delete("q");
    }

    params.delete("page");
    const query = params.toString();

    startTransition(() => {
      router.push((query ? `${pathname}?${query}` : pathname) as never);
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(value);
  }

  return (
    <form
      aria-label={text.label}
      className="flex w-full flex-col gap-3 sm:flex-row"
      onSubmit={onSubmit}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={text.label}
          className="h-12 pe-12 ps-11 text-base"
          disabled={isPending}
          onChange={(event) => setValue(event.target.value)}
          placeholder={text.placeholder}
          value={value}
        />
        {value ? (
          <button
            aria-label={text.clear}
            className="absolute end-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            disabled={isPending}
            onClick={() => {
              setValue("");
              navigate("");
            }}
            type="button"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <Button className="h-12 px-6" disabled={isPending} type="submit">
        <Search className="size-4" />
        {text.submit}
      </Button>
    </form>
  );
}
