import Image from "next/image";
import { PlayCircle } from "lucide-react";

import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { title: "الجولة الافتراضية", images360: "صور 360 درجة" },
  en: { title: "Virtual tour", images360: "360 images" },
} as const;

function getYouTubeEmbedUrl(url: string | null | undefined) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const videoId = parsed.hostname.includes("youtu.be")
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v");

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

export function VirtualTourEmbed({
  locale,
  virtualTourUrl,
  tour360ImageUrls,
}: {
  locale: Locale;
  virtualTourUrl?: string | null;
  tour360ImageUrls?: unknown;
}) {
  const text = copy[locale];
  const embedUrl = getYouTubeEmbedUrl(virtualTourUrl);
  const images = Array.isArray(tour360ImageUrls)
    ? tour360ImageUrls.filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      )
    : [];

  if (!embedUrl && images.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <PlayCircle className="size-6 text-primary" />
        {text.title}
      </h2>
      {embedUrl ? (
        <div className="aspect-video overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
            loading="lazy"
            src={embedUrl}
            title={text.title}
          />
        </div>
      ) : null}
      {images.length > 0 ? (
        <div className="grid gap-3">
          <p className="text-sm font-bold text-muted-foreground">
            {text.images360}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <div
                className="relative h-32 w-56 shrink-0 overflow-hidden rounded-md bg-muted"
                key={image}
              >
                <Image
                  alt={`${text.images360} ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="224px"
                  src={image}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
