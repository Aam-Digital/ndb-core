import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "./app/core/language/language-statics";
import { loadTranslations } from "@angular/localize";
import { registerLocaleData } from "@angular/common";
import parseXliffToJson from "./app/utils/parse-xliff-to-js";

/**
 * Load translation files and apply them to angular localize system.
 * @param locale (Optional) overwrite the locale to use (otherwise loaded from local storage)
 */
export async function initLanguage(locale?: string): Promise<void> {
  locale =
    locale ??
    localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) ??
    DEFAULT_LANGUAGE;
  if (locale === DEFAULT_LANGUAGE) {
    return;
  }

  const json = await fetch("/assets/locale/messages." + locale + ".json")
    .then((r) => r.json())
    .catch(() =>
      // parse translation at runtime if JSON file is not available
      fetch("/assets/locale/messages." + locale + ".xlf")
        .then((r) => r.text())
        .then((t) => parseXliffToJson(t)),
    );

  loadTranslations(json);
  $localize.locale = locale;
  // This is needed for locale-aware components & pipes to work.
  // Add the required locales to `webpackInclude` to keep the bundle size small
  const localeModule = await import(
    /* webpackInclude: /(fr|de|it)\.mjs/ */
    `../node_modules/@angular/common/locales/${locale}`
  );
  registerLocaleData(localeModule.default);
}
