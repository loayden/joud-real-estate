"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

import type { PropertyListItem } from "@/lib/property-listing";
import type { Locale } from "@/i18n/routing";

function formatPrice(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency: "EGP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function getLatLng(
  property: PropertyListItem,
): { lat: number; lng: number } | null {
  const lat = (property as Record<string, unknown>).latitude;
  const lng = (property as Record<string, unknown>).longitude;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat !== 0 &&
    lng !== 0
  ) {
    return { lat, lng };
  }
  return null;
}

const CAIRO_CENTER = { lat: 30.0444, lng: 31.2357 };

export function PropertyMap({
  properties,
  locale,
  selectedId,
  onSelect,
}: {
  properties: PropertyListItem[];
  locale: Locale;
  selectedId?: string;
  onSelect?: (property: PropertyListItem) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<Map<string, unknown>>(new Map());

  useEffect(() => {
    if (!mapRef.current) return;

    let L: typeof import("leaflet") | null = null;

    import("leaflet")
      .then((leaflet) => {
        L = leaflet.default;

        if (mapInstanceRef.current) return;

        const map = L.map(mapRef.current!, {
          center: [CAIRO_CENTER.lat, CAIRO_CENTER.lng],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      })
      .catch(() => {
        // Leaflet failed to load — map will show placeholder
      });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = (window as unknown as Record<string, unknown>).L as
      | typeof import("leaflet")
      | undefined;
    if (!L || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current as ReturnType<typeof L.map>;
    const currentMarkers = markersRef.current;

    const validProperties = properties.filter((p) => getLatLng(p) !== null);

    const bounds = L.latLngBounds([]);
    let hasBounds = false;

    for (const property of validProperties) {
      const coords = getLatLng(property)!;
      bounds.extend([coords.lat, coords.lng]);
      hasBounds = true;

      if (currentMarkers.has(property.id)) continue;

      const priceText = formatPrice(property.price, locale);
      const isSelected = property.id === selectedId;

      const icon = L.divIcon({
        className: "price-marker",
        html: `<div class="price-marker-inner ${isSelected ? "selected" : ""}">${priceText}</div>`,
        iconSize: [0, 0],
        iconAnchor: [50, 20],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon })
        .addTo(map)
        .on("click", () => {
          onSelect?.(property);
        });

      currentMarkers.set(property.id, marker);
    }

    for (const [id, marker] of currentMarkers) {
      if (!properties.find((p) => p.id === id)) {
        map.removeLayer(marker as ReturnType<typeof L.marker>);
        currentMarkers.delete(id);
      }
    }

    if (hasBounds && validProperties.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [properties, locale, selectedId, onSelect]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      <style>{`
        .price-marker {
          background: none !important;
          border: none !important;
        }
        .price-marker-inner {
          background: white;
          color: #1a1a2e;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 2px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.15s;
        }
        .price-marker-inner:hover,
        .price-marker-inner.selected {
          background: #0d2444;
          color: white;
          border-color: #0d2444;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
