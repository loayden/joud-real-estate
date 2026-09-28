"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { RegionCitySelect } from "@/components/shared/RegionCitySelect";
import type {
  PropertyFormData,
  StepProps,
} from "@/components/property/PropertyForm/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Navigation, Loader2 } from "lucide-react";

const text = {
  ar: {
    street: "الشارع / العنوان التفصيلي",
    streetPlaceholder: "مثال: شارع مصطفى النحاس، عمارة 25، الدور 4، شقة 12",
    address: "ملاحظات إضافية",
    addressPlaceholder: "أي تفاصيل إضافية عن الموقع...",
    building: "رقم العمارة",
    apartment: "رقم الشقة",
    floor: "الدور",
    mapTitle: "موقع العقار على الخريطة",
    mapDesc: "حدد موقع العقار بدقة لتسهيل الوصول إليه",
    useMyLocation: "استخدم موقعي الحالي",
    detecting: "جارٍ تحديد الموقع...",
    locationSet: "تم تحديد الموقع",
    locationError:
      "تعذر تحديد الموقع. يرجى المحاولة مرة أخرى أو تحديد الموقع يدوياً.",
    permissionDenied: "يرجى السماح بالوصول للموقع من إعدادات المتصفح.",
    back: "السابق",
    next: "حفظ ومتابعة",
    requiredCity: "يرجى اختيار المدينة",
    requiredArea: "يرجى اختيار المنطقة",
    dragPin: "اسحب العلامة لتغيير الموقع",
    lat: "خط العرض",
    lng: "خط الطول",
  },
  en: {
    street: "Street / Detailed address",
    streetPlaceholder: "e.g. 25 Mostafa Kamel St, Floor 4, Apt 12",
    address: "Additional notes",
    addressPlaceholder: "Any additional location details...",
    building: "Building no.",
    apartment: "Apt no.",
    floor: "Floor",
    mapTitle: "Property location on map",
    mapDesc: "Pin the exact property location for easy access",
    useMyLocation: "Use my current location",
    detecting: "Detecting location...",
    locationSet: "Location set",
    locationError:
      "Could not detect location. Please try again or set manually.",
    permissionDenied: "Please allow location access in browser settings.",
    back: "Back",
    next: "Save and continue",
    requiredCity: "Please select a city",
    requiredArea: "Please select an area",
    dragPin: "Drag the marker to change location",
    lat: "Latitude",
    lng: "Longitude",
  },
} as const;

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

export function StepLocation({
  data,
  isSaving,
  locale,
  onBack,
  onNext,
}: StepProps) {
  const copy = text[locale];
  const [location, setLocation] = useState({
    regionId: data.regionId ?? "",
    cityId: data.cityId ?? "",
    neighborhoodId: data.neighborhoodId ?? null,
  });
  const [street, setStreet] = useState(data.street ?? "");
  const [buildingNumber, setBuildingNumber] = useState(
    data.buildingNumber ?? "",
  );
  const [apartmentNumber, setApartmentNumber] = useState(
    data.apartmentNumber ?? "",
  );
  const [floorNumber, setFloorNumber] = useState(
    data.floorNumber?.toString() ?? "",
  );
  const [address, setAddress] = useState(data.address ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(data.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(
    data.longitude,
  );
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "set" | "error"
  >(data.latitude && data.longitude ? "set" : "idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mapCenter, setMapCenter] = useState({
    lat: data.latitude ?? DEFAULT_CENTER.lat,
    lng: data.longitude ?? DEFAULT_CENTER.lng,
  });
  const [mapZoom, setMapZoom] = useState(data.latitude ? 15 : 10);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapInitializedRef = useRef(false);
  // Initial view captured once: the init effect below is mount-only, and
  // subsequent center/zoom changes are applied by the sync effect.
  const initialViewRef = useRef({
    lat: data.latitude ?? DEFAULT_CENTER.lat,
    lng: data.longitude ?? DEFAULT_CENTER.lng,
    zoom: data.latitude ? 15 : 10,
  });

  const handleLocationChange = useCallback(
    (
      region: {
        id: string;
        latitude?: string | number | null;
        longitude?: string | number | null;
      } | null,
      city: {
        id: string;
        latitude?: string | number | null;
        longitude?: string | number | null;
      } | null,
      neighborhood: { id: string } | null,
    ) => {
      setLocation((prev) => {
        const next = {
          regionId: region?.id ?? "",
          cityId: city?.id ?? "",
          neighborhoodId: neighborhood?.id ?? null,
        };
        if (
          prev.regionId === next.regionId &&
          prev.cityId === next.cityId &&
          prev.neighborhoodId === next.neighborhoodId
        ) {
          return prev;
        }
        return next;
      });

      const cityLat = city?.latitude ? Number(city.latitude) : undefined;
      const cityLng = city?.longitude ? Number(city.longitude) : undefined;
      if (cityLat && cityLng) {
        setMapCenter({ lat: cityLat, lng: cityLng });
        setMapZoom(13);
        if (markerRef.current) {
          markerRef.current.setLatLng([cityLat, cityLng]);
          setLatitude(cityLat);
          setLongitude(cityLng);
          setLocationStatus("set");
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!mapRef.current || mapInitializedRef.current) return;

    let cancelled = false;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;

        if (cancelled || !mapRef.current) return;

        const initialView = initialViewRef.current;
        const map = L.map(mapRef.current, {
          center: [initialView.lat, initialView.lng],
          zoom: initialView.zoom,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:28px;height:28px;background:#1B4B8A;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([initialView.lat, initialView.lng], {
          icon,
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          setLatitude(pos.lat);
          setLongitude(pos.lng);
          setLocationStatus("set");
        });

        map.on("click", (e: L.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng);
          setLatitude(e.latlng.lat);
          setLongitude(e.latlng.lng);
          setLocationStatus("set");
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        mapInitializedRef.current = true;
        setMapLoaded(true);
      } catch {
        // Leaflet failed to load — map stays hidden
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && mapLoaded) {
      mapInstanceRef.current.setView([mapCenter.lat, mapCenter.lng], mapZoom);
      markerRef.current.setLatLng([mapCenter.lat, mapCenter.lng]);
    }
  }, [mapCenter.lat, mapCenter.lng, mapZoom, mapLoaded]);

  function detectCurrentLocation() {
    if (!navigator.geolocation) {
      setErrorMsg(
        locale === "ar"
          ? "المتصفح لا يدعم تحديد الموقع"
          : "Geolocation not supported",
      );
      setLocationStatus("error");
      return;
    }

    setLocating(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setMapCenter({ lat, lng });
        setMapZoom(16);
        setLocationStatus("set");
        setLocating(false);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      },
      (error) => {
        setLocating(false);
        setLocationStatus("error");
        if (error.code === 1) {
          setErrorMsg(copy.permissionDenied);
        } else {
          setErrorMsg(copy.locationError);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const hasRequiredFields = location.regionId && location.cityId;

  return (
    <div className="grid gap-6">
      <RegionCitySelect
        cityId={location.cityId}
        neighborhoodId={location.neighborhoodId ?? undefined}
        onChange={handleLocationChange}
        regionId={location.regionId}
        required
        showNeighborhood={false}
      />

      <div className="grid gap-2">
        <Label htmlFor="street">{copy.street}</Label>
        <Textarea
          id="street"
          onChange={(event) => setStreet(event.target.value)}
          placeholder={copy.streetPlaceholder}
          rows={2}
          value={street}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="buildingNumber">{copy.building}</Label>
          <Input
            id="buildingNumber"
            onChange={(event) => setBuildingNumber(event.target.value)}
            value={buildingNumber}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="apartmentNumber">{copy.apartment}</Label>
          <Input
            id="apartmentNumber"
            onChange={(event) => setApartmentNumber(event.target.value)}
            value={apartmentNumber}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="floorNumber">{copy.floor}</Label>
          <Input
            id="floorNumber"
            inputMode="numeric"
            max={100}
            min={0}
            onChange={(event) => setFloorNumber(event.target.value)}
            type="number"
            value={floorNumber}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="addressNotes">{copy.address}</Label>
        <Textarea
          id="addressNotes"
          onChange={(event) => setAddress(event.target.value)}
          placeholder={copy.addressPlaceholder}
          rows={2}
          value={address}
        />
      </div>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-h4 font-bold">
              <MapPin className="size-5 text-primary" />
              {copy.mapTitle}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{copy.mapDesc}</p>
          </div>
          <Button
            onClick={detectCurrentLocation}
            disabled={locating}
            size="sm"
            type="button"
            variant="secondary"
          >
            {locating ? (
              <Loader2 className="ms-1.5 size-4 animate-spin" />
            ) : (
              <Navigation className="ms-1.5 size-4" />
            )}
            {locating ? copy.detecting : copy.useMyLocation}
          </Button>
        </div>

        {locationStatus === "error" ? (
          <Alert variant="destructive">{errorMsg}</Alert>
        ) : null}

        {locationStatus === "set" ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            <MapPin className="size-4" />
            {copy.locationSet}
            {latitude && longitude ? (
              <span className="text-xs font-normal text-emerald-600">
                ({latitude.toFixed(5)}, {longitude.toFixed(5)})
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          ref={mapRef}
          className="relative h-[300px] w-full overflow-hidden rounded-lg border border-border sm:h-[400px]"
        />

        {latitude && longitude ? (
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>
              {copy.lat}: {latitude.toFixed(7)}
            </span>
            <span>
              {copy.lng}: {longitude.toFixed(7)}
            </span>
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between">
        <Button
          disabled={isSaving}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          {copy.back}
        </Button>
        <Button
          disabled={isSaving || !hasRequiredFields}
          onClick={() =>
            onNext({
              ...location,
              street: street.trim() || undefined,
              buildingNumber: buildingNumber.trim() || undefined,
              apartmentNumber: apartmentNumber.trim() || undefined,
              floorNumber: floorNumber ? Number(floorNumber) : undefined,
              address: address.trim() || undefined,
              latitude: latitude,
              longitude: longitude,
            } satisfies Partial<PropertyFormData>)
          }
          type="button"
        >
          {isSaving ? "..." : copy.next}
        </Button>
      </div>
    </div>
  );
}
