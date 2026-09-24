import DOMPurify from "isomorphic-dompurify";

import type { PropertyMutationInput } from "@/lib/validations/property";

const plainTextSanitizeOptions = {
  ALLOWED_ATTR: [],
  ALLOWED_TAGS: [],
};

export function sanitizePlainText(value: string) {
  return DOMPurify.sanitize(value, plainTextSanitizeOptions).trim();
}

export function sanitizeOptionalPlainText<T extends string | undefined | null>(
  value: T,
) {
  if (typeof value !== "string") {
    return value;
  }

  const sanitized = sanitizePlainText(value);
  return (sanitized.length > 0 ? sanitized : undefined) as T;
}

export function sanitizePropertyInput<T extends PropertyMutationInput>(
  input: T,
): T {
  return {
    ...input,
    titleAr:
      typeof input.titleAr === "string"
        ? sanitizePlainText(input.titleAr)
        : input.titleAr,
    titleEn: sanitizeOptionalPlainText(input.titleEn),
    descriptionAr:
      typeof input.descriptionAr === "string"
        ? sanitizePlainText(input.descriptionAr)
        : input.descriptionAr,
    descriptionEn: sanitizeOptionalPlainText(input.descriptionEn),
    address: sanitizeOptionalPlainText(input.address),
  };
}
