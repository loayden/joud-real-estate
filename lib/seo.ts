import { locales, type Locale } from "@/i18n/routing";
import { getAppUrl } from "@/lib/app-url";

export function getSeoAppUrl() {
  return getAppUrl();
}

export function absoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  return `${getSeoAppUrl()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function localizedUrl(locale: Locale, path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSeoAppUrl()}/${locale}${path ? normalizedPath : ""}`;
}

export function alternateLanguages(path: string) {
  return Object.fromEntries(
    locales.map((locale) => [locale, localizedUrl(locale, path)]),
  ) as Record<Locale, string>;
}
