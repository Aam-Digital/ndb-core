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
