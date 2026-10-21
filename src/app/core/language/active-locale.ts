/**
 * The active locale, available outside of Angular's DI so that model classes
 * like `Entity` can resolve multi-lingual configured texts
 * Kept free of `@angular/*` imports to avoid a circular import with `Entity`.
 */
import {
  isTranslatableText,
  mergeTranslatableValues,
  resolveTranslatableConfig,
  resolveTranslatableText,
  TranslatableText,
} from "../config/multi-lingual-config";
import { AVAILABLE_LOCALE_IDS } from "./available-locales";
import { DEFAULT_LANGUAGE } from "./language-statics";

let activeLocale: string = DEFAULT_LANGUAGE;
let validLocaleIds: readonly string[] = AVAILABLE_LOCALE_IDS;

/** Called once during app startup by `LanguageModule`. */
export function configureActiveLocale(
  locale: string,
  locales: readonly string[],
): void {
  if (locale) {
    activeLocale = locale;
  }
  if (locales?.length) {
    validLocaleIds = locales;
  }
}

/** The id of the active locale, e.g. to store a text edited in the active language. */
export function getActiveLocale(): string {
  return activeLocale;
}

/** Whether the value is a per-language map of one of the available locales. */
export function isLocaleTranslationMap(
  value: unknown,
): value is Record<string, string> {
  return isTranslatableText(value, validLocaleIds);
}

/** Values that are not translation maps are returned unchanged. */
export function resolveLocaleText(
  value: TranslatableText | null | undefined,
): string | undefined;
export function resolveLocaleText(value: unknown): unknown;
export function resolveLocaleText(value: unknown): unknown {
  return resolveTranslatableText(
    value as TranslatableText,
    activeLocale,
    DEFAULT_LANGUAGE,
    validLocaleIds,
  );
}

/** Deep-resolve, returning a new structure so the input stays raw. */
export function resolveLocaleConfig<T>(value: T): T {
  return resolveTranslatableConfig(
    value,
    activeLocale,
    DEFAULT_LANGUAGE,
    validLocaleIds,
  );
}

/** {@link mergeTranslatableValues} for the active locale. */
export function mergeLocaleTranslations<T extends Record<string, any>>(
  raw: Record<string, any> | undefined,
  edited: T,
  translatableKeys?: readonly string[],
): T {
  return mergeTranslatableValues(
    raw,
    edited,
    activeLocale,
    DEFAULT_LANGUAGE,
    validLocaleIds,
    translatableKeys,
  );
}
