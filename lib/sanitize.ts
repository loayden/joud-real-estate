import type { PropertyMutationInput } from "@/lib/validations/property";

// NOTE: previously backed by isomorphic-dompurify (jsdom), which crashes at
// runtime in the production serverless bundle (CJS require() of ESM-only
// transitive deps: html-encoding-sniffer -> @exodus/bytes). All call sites
// only need plain-text tag stripping for fields that React auto-escapes on
// render, so a dependency-free implementation is both safer and sufficient.
export function sanitizePlainText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
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
