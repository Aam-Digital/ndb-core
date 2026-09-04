/**
 * The active locale, available outside of Angular's DI so that model classes
 * like `Entity` can resolve multi-lingual configured texts
 * Kept free of `@angular/*` imports to avoid a circular import with `Entity`.
 */
import {
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

/** Values that are not translation maps are returned unchanged. */
export function resolveActiveText(
  value: TranslatableText | null | undefined,
): string | undefined;
export function resolveActiveText(value: unknown): unknown;
export function resolveActiveText(value: unknown): unknown {
  return resolveTranslatableText(
    value as TranslatableText,
    activeLocale,
    DEFAULT_LANGUAGE,
    validLocaleIds,
  );
}

/** Deep-resolve, returning a new structure so the input stays raw. */
export function resolveActiveConfig<T>(value: T): T {
  return resolveTranslatableConfig(
    value,
    activeLocale,
    DEFAULT_LANGUAGE,
    validLocaleIds,
  );
}
