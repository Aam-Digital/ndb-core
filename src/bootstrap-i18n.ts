import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "./app/core/language/language-statics";
import { loadTranslations } from "@angular/localize";
import { registerLocaleData } from "@angular/common";
import parseXliffToJson from "./app/utils/parse-xliff-to-js";
import { Logging } from "#src/app/core/logging/logging.service";

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
        .then((t) => parseXliffToJson(t))
        .catch((err) => {
          Logging.error(`Error loading translations for locale ${locale}`, err);
          return {};
        }),
    );

  loadTranslations(json);
  $localize.locale = locale;
  // This is needed for locale-aware components & pipes to work.
  // Add the required locales to `webpackInclude` to keep the bundle size small
  let localeModule;
  if (locale == "de") {
    localeModule = await import("@angular/common/locales/de");
  } else if (locale == "fr") {
    localeModule = await import("@angular/common/locales/fr");
  } else if (locale == "it") {
    localeModule = await import("@angular/common/locales/it");
  }

  if (localeModule) {
    registerLocaleData(localeModule.default);
  }
}
