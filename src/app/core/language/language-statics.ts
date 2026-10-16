export const LANGUAGE_LOCAL_STORAGE_KEY = "locale";
export const DEFAULT_LANGUAGE = "en-US";

/**
 * Whether the given value can be used as a locale to look up translations.
 *
 * Non-string values (e.g. a whole dropdown option object) are silently stringified
 * by localStorage and would end up being requested from the translations CDN,
 * so they have to be rejected before they are stored or used.
 */
export function isValidLocale(value: unknown): value is string {
  return (
    typeof value === "string" && /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(value)
  );
}

/** Copied from CDK's `RTL_LOCALE_PATTERN` (`@angular/cdk/bidi`), which is not exported. */
const RTL_LANGUAGES = new Set([
  "ar",
  "ckb",
  "dv",
  "fa",
  "he",
  "iw",
  "nqo",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
]);

/** Matches on the language subtag, so regional variants like `ar-EG` are covered too. */
export function isRtlLocale(locale: string): boolean {
  return RTL_LANGUAGES.has(locale.split("-")[0].toLowerCase());
}
