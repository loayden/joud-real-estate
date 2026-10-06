"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type PexelsImage = {
  id: number | string;
  alt: string;
  src: string;
};

const ROTATE_MS = 6500;

export function HeroPexels({
  fallback = "/images/joud-hero.jpg",
  photos = [],
}: {
  fallback?: string;
  photos?: PexelsImage[];
}) {
  const [images, setImages] = useState<PexelsImage[]>(photos);
  const [index, setIndex] = useState(0);
  const gallery =
    images.length > 0 ? images : [{ id: "fallback", alt: "", src: fallback }];

  useEffect(() => {
    if (photos.length > 0) return;

    let cancelled = false;

    async function loadImages() {
      try {
        const response = await fetch("/api/pexels/hero");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          success: boolean;
          data?: { images: PexelsImage[] };
        };

        if (!cancelled && payload.success && payload.data?.images.length) {
          setImages(payload.data.images);
        }
      } catch {
        // Keep the static fallback — hero must never break.
      }
    }

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [photos.length]);

  useEffect(() => {
    if (gallery.length <= 1) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let interval: number | undefined;

    function start() {
      stop();
      interval = window.setInterval(() => {
        setIndex((current) => (current + 1) % gallery.length);
      }, ROTATE_MS);
    }

    function stop() {
      if (interval !== undefined) window.clearInterval(interval);
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [gallery.length]);

  return (
    <div aria-hidden className="absolute inset-0">
      {gallery.map((image, position) => {
        const active = position === index % gallery.length;
        return (
          <Image
            alt=""
            aria-hidden
            className={cn(
              "object-cover transition-opacity duration-[1200ms] ease-out",
              active ? "opacity-100" : "opacity-0",
            )}
            fetchPriority={position === 0 ? "high" : undefined}
            fill
            key={image.id}
            priority={position === 0}
            sizes="100vw"
            src={image.src}
          />
        );
      })}
    </div>
  );
}
