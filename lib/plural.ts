// Arabic cardinal noun selection.
// 0 → few, 1 → one, 2 → two (dual), 3–10 → few (plural), 11+ → many (singular).
// e.g. result: 1 نتيجة، 2 نتيجتان، 8 نتائج، 15 نتيجة.
export function arabicUnit(
  n: number,
  forms: { one: string; two: string; few: string; many: string },
): string {
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  if (n >= 3 && n <= 10) return forms.few;
  if (n === 0) return forms.few;
  return forms.many;
}

export function formatArabicCount(
  n: number,
  locale: "ar" | "en",
  forms: { one: string; two: string; few: string; many: string },
  englishPlural: string,
  englishSingular: string,
): string {
  const num = n.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
  const unit =
    locale === "ar"
      ? arabicUnit(n, forms)
      : n === 1
        ? englishSingular
        : englishPlural;
  return `${num} ${unit}`;
}
