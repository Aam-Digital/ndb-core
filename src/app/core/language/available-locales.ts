/**
 * The locales the app can be used in.
 *
 * Separate from `languages.ts` because that builds a `ConfigurableEnum`, which
 * extends `Entity` - and `Entity` needs the locale ids itself (see #3862).
 */
export const AVAILABLE_LOCALES = [
  { id: "en-US", label: "English (en)" },
  { id: "de", label: "Deutsch / German (de)" },
  { id: "fr", label: "Français / French (fr)" },
] as const;

export const AVAILABLE_LOCALE_IDS: readonly string[] = AVAILABLE_LOCALES.map(
  (locale) => locale.id,
);
