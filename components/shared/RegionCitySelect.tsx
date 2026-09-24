"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type RegionOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  code: string | null;
};

export type CityOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  latitude: string | number | null;
  longitude: string | number | null;
};

export type NeighborhoodOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
};

const copy = {
  ar: {
    region: "المدينة",
    city: "المنطقة",
    neighborhood: "الحي",
    selectRegion: "اختر المدينة",
    selectCity: "اختر المنطقة",
    selectNeighborhood: "اختر الحي",
    loading: "جار التحميل",
    loadError: "تعذر تحميل البيانات الجغرافية.",
    searchArea: "ابحث عن منطقة...",
  },
  en: {
    region: "City",
    city: "Area",
    neighborhood: "Neighborhood",
    selectRegion: "Select city",
    selectCity: "Select area",
    selectNeighborhood: "Select neighborhood",
    loading: "Loading",
    loadError: "Could not load geographic data.",
    searchArea: "Search area...",
  },
} as const;

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(path);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Request failed" : payload.error);
  }

  return payload.data;
}

function getName(
  item: { nameAr: string; nameEn: string },
  locale: "ar" | "en",
) {
  return locale === "ar" ? item.nameAr : item.nameEn;
}

export function RegionCitySelect({
  regionId,
  cityId,
  neighborhoodId,
  onChange,
  required = false,
  showNeighborhood = false,
  className,
}: {
  regionId?: string;
  cityId?: string;
  neighborhoodId?: string;
  onChange: (
    region: RegionOption | null,
    city: CityOption | null,
    neighborhood: NeighborhoodOption | null,
  ) => void;
  required?: boolean;
  showNeighborhood?: boolean;
  className?: string;
}) {
  const locale = (useLocale() === "en" ? "en" : "ar") as "ar" | "en";
  const text = copy[locale];
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOption[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState(regionId ?? "");
  const [selectedCityId, setSelectedCityId] = useState(cityId ?? "");
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState(
    neighborhoodId ?? "",
  );
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areaSearch, setAreaSearch] = useState("");
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const areaSearchRef = useRef<HTMLDivElement>(null);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === selectedRegionId) ?? null,
    [regions, selectedRegionId],
  );
  const selectedCity = useMemo(
    () => cities.find((city) => city.id === selectedCityId) ?? null,
    [cities, selectedCityId],
  );
  const selectedNeighborhood = useMemo(
    () =>
      neighborhoods.find(
        (neighborhood) => neighborhood.id === selectedNeighborhoodId,
      ) ?? null,
    [neighborhoods, selectedNeighborhoodId],
  );

  const filteredCities = useMemo(() => {
    if (!areaSearch.trim()) return cities;
    const q = areaSearch.toLowerCase();
    return cities.filter(
      (c) =>
        c.nameAr.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.slug.includes(q),
    );
  }, [cities, areaSearch]);

  useEffect(() => {
    let mounted = true;

    async function loadRegions() {
      setIsLoadingRegions(true);
      setError(null);

      try {
        const data = await fetchApi<RegionOption[]>("/api/regions");
        if (mounted) setRegions(data);
      } catch {
        if (mounted) setError(text.loadError);
      } finally {
        if (mounted) setIsLoadingRegions(false);
      }
    }

    void loadRegions();

    return () => {
      mounted = false;
    };
  }, [text.loadError]);

  useEffect(() => {
    setSelectedRegionId(regionId ?? "");
  }, [regionId]);

  useEffect(() => {
    setSelectedCityId(cityId ?? "");
  }, [cityId]);

  useEffect(() => {
    setSelectedNeighborhoodId(neighborhoodId ?? "");
  }, [neighborhoodId]);

  useEffect(() => {
    let mounted = true;

    async function loadCities() {
      setCities([]);
      setNeighborhoods([]);

      if (!selectedRegion) {
        setSelectedCityId("");
        setSelectedNeighborhoodId("");
        return;
      }

      setIsLoadingCities(true);
      setError(null);

      try {
        const data = await fetchApi<CityOption[]>(
          `/api/regions/${selectedRegion.slug}/cities`,
        );
        if (mounted) {
          setCities(data);
          if (
            selectedCityId &&
            !data.some((city) => city.id === selectedCityId)
          ) {
            setSelectedCityId("");
            setSelectedNeighborhoodId("");
          }
        }
      } catch {
        if (mounted) setError(text.loadError);
      } finally {
        if (mounted) setIsLoadingCities(false);
      }
    }

    void loadCities();

    return () => {
      mounted = false;
    };
  }, [selectedRegion, selectedCityId, text.loadError]);

  useEffect(() => {
    let mounted = true;

    async function loadNeighborhoods() {
      setNeighborhoods([]);

      if (!showNeighborhood || !selectedCity) {
        setSelectedNeighborhoodId("");
        return;
      }

      setIsLoadingNeighborhoods(true);
      setError(null);

      try {
        const data = await fetchApi<NeighborhoodOption[]>(
          `/api/cities/${selectedCity.slug}/neighborhoods`,
        );
        if (mounted) {
          setNeighborhoods(data);
          if (
            selectedNeighborhoodId &&
            !data.some(
              (neighborhood) => neighborhood.id === selectedNeighborhoodId,
            )
          ) {
            setSelectedNeighborhoodId("");
          }
        }
      } catch {
        if (mounted) setError(text.loadError);
      } finally {
        if (mounted) setIsLoadingNeighborhoods(false);
      }
    }

    void loadNeighborhoods();

    return () => {
      mounted = false;
    };
  }, [selectedCity, selectedNeighborhoodId, showNeighborhood, text.loadError]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const prevSelections = useRef({
    regionId: "",
    cityId: "",
    neighborhoodId: "",
  });

  useEffect(() => {
    const regionKey = selectedRegion?.id ?? "";
    const cityKey = selectedCity?.id ?? "";
    const neighborhoodKey = selectedNeighborhood?.id ?? "";

    if (
      regionKey === prevSelections.current.regionId &&
      cityKey === prevSelections.current.cityId &&
      neighborhoodKey === prevSelections.current.neighborhoodId
    ) {
      return;
    }

    prevSelections.current = {
      regionId: regionKey,
      cityId: cityKey,
      neighborhoodId: neighborhoodKey,
    };
    onChangeRef.current(selectedRegion, selectedCity, selectedNeighborhood);
  }, [selectedCity, selectedNeighborhood, selectedRegion]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        areaSearchRef.current &&
        !areaSearchRef.current.contains(event.target as Node)
      ) {
        setShowAreaDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCityName = selectedCity ? getName(selectedCity, locale) : "";

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {error ? (
        <div className="md:col-span-2">
          <Alert variant="destructive">{error}</Alert>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="region">{text.region}</Label>
        <Select
          disabled={isLoadingRegions}
          id="region"
          onChange={(event) => {
            setSelectedRegionId(event.target.value);
            setSelectedCityId("");
            setSelectedNeighborhoodId("");
            setAreaSearch("");
          }}
          required={required}
          value={selectedRegionId}
        >
          <option value="">
            {isLoadingRegions ? text.loading : text.selectRegion}
          </option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {getName(region, locale)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-2" ref={areaSearchRef}>
        <Label htmlFor="city">{text.city}</Label>
        <div className="relative">
          <Input
            id="city"
            autoComplete="off"
            disabled={!selectedRegionId || isLoadingCities}
            onChange={(e) => {
              setAreaSearch(e.target.value);
              setShowAreaDropdown(true);
              if (!e.target.value && selectedCityId) {
                setSelectedCityId("");
                setSelectedNeighborhoodId("");
              }
            }}
            onFocus={() => selectedRegionId && setShowAreaDropdown(true)}
            placeholder={
              isLoadingCities
                ? text.loading
                : selectedCityName || text.selectCity
            }
            required={required}
            value={showAreaDropdown ? areaSearch : selectedCityName}
          />
          {showAreaDropdown && selectedRegionId && !isLoadingCities && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background shadow-md">
              {filteredCities.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد نتائج" : "No results found"}
                </div>
              ) : (
                filteredCities.map((city) => (
                  <button
                    key={city.id}
                    className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-muted ${
                      city.id === selectedCityId
                        ? "bg-primary-50 font-bold text-primary"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedCityId(city.id);
                      setSelectedNeighborhoodId("");
                      setAreaSearch("");
                      setShowAreaDropdown(false);
                    }}
                    type="button"
                  >
                    {getName(city, locale)}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <input type="hidden" value={selectedCityId} />
      </div>

      {showNeighborhood && neighborhoods.length > 0 ? (
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="neighborhood">{text.neighborhood}</Label>
          <Select
            disabled={!selectedCityId || isLoadingNeighborhoods}
            id="neighborhood"
            onChange={(event) => setSelectedNeighborhoodId(event.target.value)}
            value={selectedNeighborhoodId}
          >
            <option value="">
              {isLoadingNeighborhoods ? text.loading : text.selectNeighborhood}
            </option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {getName(neighborhood, locale)}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
    </div>
  );
}
