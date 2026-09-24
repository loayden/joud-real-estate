import type { ListingType, PropertyStatus } from "@prisma/client";

export type PropertyFormData = {
  id?: string;
  slug?: string;
  status?: PropertyStatus;
  titleAr: string;
  titleEn?: string;
  descriptionAr: string;
  descriptionEn?: string;
  listingType: ListingType;
  categoryId: string;
  typeId: string;
  regionId?: string;
  cityId?: string;
  neighborhoodId?: string | null;
  price?: number;
  priceNegotiable: boolean;
  area?: number;
  areaUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  streetWidth?: number;
  address?: string;
  street?: string;
  buildingNumber?: string;
  apartmentNumber?: string;
  floorNumber?: number;
  latitude?: number;
  longitude?: number;
  amenityIds: string[];
  images?: PropertyImageItem[];
};

export type PropertyImageItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  isPrimary: boolean;
  sortOrder: number;
  mediaType?: string;
};

export type SerializedProperty = PropertyFormData & {
  id: string;
  slug: string;
  status: PropertyStatus;
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type StepProps = {
  data: PropertyFormData;
  isSaving: boolean;
  locale: "ar" | "en";
  onBack: () => void;
  onNext: (partial: Partial<PropertyFormData>) => Promise<void>;
};

export const emptyPropertyFormData: PropertyFormData = {
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  listingType: "SALE",
  categoryId: "",
  typeId: "",
  regionId: "",
  cityId: "",
  neighborhoodId: null,
  priceNegotiable: false,
  areaUnit: "sqm",
  street: "",
  buildingNumber: "",
  apartmentNumber: "",
  floorNumber: undefined,
  latitude: undefined,
  longitude: undefined,
  amenityIds: [],
  images: [],
};
