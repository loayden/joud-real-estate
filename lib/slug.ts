import { createId } from "@paralleldrive/cuid2";
import slugify from "slugify";

const arabicToLatin: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ى: "a",
  ة: "h",
  ء: "",
  ئ: "y",
  ؤ: "w",
  "َ": "",
  "ُ": "",
  "ِ": "",
  "ً": "",
  "ٌ": "",
  "ٍ": "",
  "ْ": "",
  "ّ": "",
};

function transliterateArabic(input: string) {
  return Array.from(input)
    .map((char) => arabicToLatin[char] ?? char)
    .join("");
}

export function generatePropertySlug(titleAr: string, citySlug: string) {
  const titleSlug = slugify(transliterateArabic(titleAr), {
    lower: true,
    strict: true,
    trim: true,
  });

  const base = titleSlug || "property";
  return `${base}-${citySlug}-${createId().slice(0, 8)}`;
}
