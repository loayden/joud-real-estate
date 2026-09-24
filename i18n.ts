import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

import { locales, type Locale } from "./i18n/routing";
import arMessages from "./messages/ar.json";
import enMessages from "./messages/en.json";

const messages = {
  ar: arMessages,
  en: enMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  const resolvedLocale = locale as Locale;

  return {
    locale: resolvedLocale,
    messages: messages[resolvedLocale],
  };
});
