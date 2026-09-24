export type SearchCityOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
};

export type SearchRegionOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  cities: SearchCityOption[];
};

export type SearchPropertyTypeOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
};

export type SearchCategoryOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  types: SearchPropertyTypeOption[];
};

export type SearchFilterLookups = {
  regions: SearchRegionOption[];
  categories: SearchCategoryOption[];
};
