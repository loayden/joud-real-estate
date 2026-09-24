"use client";

import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: {
    placeholder: "جرب: فيلا 4 غرف في الشيخ زايد بسعر أقل من 10 مليون",
    search: "بحث",
    searching: "جاري البحث...",
    voiceHint: "البحث الصوتي قريباً",
  },
  en: {
    placeholder: "Try: 4 bedroom villa in Sheikh Zayed under 10 million",
    search: "Search",
    searching: "Searching...",
    voiceHint: "Voice search coming soon",
  },
} as const;

export function ConversationalSearch({
  locale,
  onResults,
}: {
  locale: Locale;
  onResults?: (results: unknown) => void;
}) {
  const text = copy[locale];
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      try {
        const params = new URLSearchParams({ q: query.trim() });
        const res = await fetch(`/api/v1/search/semantic?${params.toString()}`);
        const data = await res.json();

        if (data.success && data.data) {
          if (onResults) {
            onResults(data.data);
          } else {
            const sp = new URLSearchParams();
            if (data.data.parsedFilters?.q)
              sp.set("q", data.data.parsedFilters.q);
            if (data.data.parsedFilters?.listingType)
              sp.set("listingType", data.data.parsedFilters.listingType);
            if (data.data.parsedFilters?.citySlug)
              sp.set("citySlug", data.data.parsedFilters.citySlug);
            if (data.data.parsedFilters?.minPrice)
              sp.set("minPrice", data.data.parsedFilters.minPrice);
            if (data.data.parsedFilters?.maxPrice)
              sp.set("maxPrice", data.data.parsedFilters.maxPrice);
            if (data.data.parsedFilters?.bedrooms)
              sp.set("bedrooms", data.data.parsedFilters.bedrooms);
            router.push(`/${locale}/search?${sp.toString()}`);
          }
        }
      } catch {
        // silently fail
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <Input
          aria-label={text.placeholder}
          className="h-12 border-transparent pl-10 text-foreground"
          disabled={isPending}
          name="q"
          onChange={(e) => setQuery(e.target.value)}
          placeholder={text.placeholder}
          type="search"
          value={query}
        />
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      <Button
        className="h-12 px-6"
        disabled={isPending || !query.trim()}
        type="submit"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Search className="size-4" />
            {text.search}
          </>
        )}
      </Button>
    </form>
  );
}
