"use client";

import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  isPrimary: boolean;
};

const fallbackImage = "/images/property-placeholder.jpg";

export function PropertyImageGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const galleryImages = useMemo(
    () =>
      images.length > 0
        ? images.map((image) => ({
            ...image,
            thumbnailUrl: image.thumbnailUrl ?? image.url,
          }))
        : [
            {
              id: "placeholder",
              isPrimary: true,
              thumbnailUrl: fallbackImage,
              url: fallbackImage,
            },
          ],
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];

  const move = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        const next = current + direction;

        if (next < 0) return galleryImages.length - 1;
        if (next >= galleryImages.length) return 0;
        return next;
      });
    },
    [galleryImages.length],
  );

  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  const selectImage = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }

    // Lock background scroll while the lightbox is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      // Return focus to the gallery trigger for keyboard users
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [closeLightbox, isLightboxOpen, move]);

  return (
    <section aria-label={title} className="grid gap-3">
      <button
        ref={triggerRef}
        className="transition-lift group relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted text-start hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={openLightbox}
        type="button"
      >
        <Image
          alt={title}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          fill
          priority
          sizes="(min-width: 1024px) 70vw, 100vw"
          src={activeImage.url}
        />
        <span className="tnum absolute bottom-4 end-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-2 text-small font-bold text-white backdrop-blur-sm">
          <Maximize2 className="size-4" />
          {activeIndex + 1} / {galleryImages.length}
        </span>
      </button>

      {galleryImages.length > 1 ? (
        <div className="snap-strip flex gap-2 overflow-x-auto pb-1">
          {galleryImages.map((image, index) => (
            <button
              aria-label={`${title} ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={cn(
                "transition-all-fast relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                index === activeIndex
                  ? "border-primary shadow-sm"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
              key={image.id}
              onClick={() => selectImage(index)}
              type="button"
            >
              <Image
                alt=""
                aria-hidden
                className="object-cover"
                fill
                loading="lazy"
                sizes="112px"
                src={image.thumbnailUrl}
              />
            </button>
          ))}
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-black/90 p-4"
          role="dialog"
        >
          <h2 className="sr-only">{title}</h2>
          <Button
            aria-label="Close"
            className="absolute end-4 top-4 size-11 rounded-full"
            onClick={closeLightbox}
            size="icon"
            type="button"
            variant="secondary"
          >
            <X className="size-5" />
          </Button>
          <Button
            aria-label="Previous image"
            className="absolute start-4 top-1/2 size-11 -translate-y-1/2 rounded-full"
            onClick={() => move(-1)}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronRight className="size-5 rtl:hidden" />
            <ChevronLeft className="hidden size-5 rtl:block" />
          </Button>
          <div className="relative h-[78vh] w-full max-w-6xl">
            <Image
              alt={title}
              className="object-contain"
              fill
              sizes="100vw"
              src={activeImage.url}
            />
          </div>
          <Button
            aria-label="Next image"
            className="absolute end-4 top-1/2 size-11 -translate-y-1/2 rounded-full"
            onClick={() => move(1)}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronLeft className="size-5 rtl:hidden" />
            <ChevronRight className="hidden size-5 rtl:block" />
          </Button>
          <div className="tnum absolute bottom-4 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
            {activeIndex + 1} / {galleryImages.length}
          </div>
        </div>
      ) : null}
    </section>
  );
}
