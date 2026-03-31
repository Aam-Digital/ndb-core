import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "./app/core/language/language-statics";
import { loadTranslations } from "@angular/localize";
import { registerLocaleData } from "@angular/common";
import { environment } from "./environments/environment";
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

  const json = await fetchTranslations(locale);

  if (json === undefined) {
    return;
  }

  loadTranslations(json);
  $localize.locale = locale;
  // This is needed for locale-aware components & pipes to work.
  // Add the required locales to `webpackInclude` to keep the bundle size small
  let localeModule;
  if (locale == "de") {
    localeModule = await import("@angular/common/locales/de");
  } else if (locale == "fr") {
    localeModule = await import("@angular/common/locales/fr");
  }

  if (localeModule) {
    registerLocaleData(localeModule.default);
  }
}

async function fetchTranslations(
  locale: string,
): Promise<Record<string, string> | undefined> {
  const cdnUrl = environment.translationsCdnUrl;
  if (cdnUrl) {
    const versionedUrl = `${cdnUrl}/${environment.appVersion}/messages.${locale}.json`;
    const latestUrl = `${cdnUrl}/latest/messages.${locale}.json`;

    for (const url of [versionedUrl, latestUrl]) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        Logging.debug(`CDN fetch failed for '${url}':`, e);
      }
    }
  }

  Logging.warn(
    `Could not load translations for locale '${locale}', falling back to default language.`,
  );
  return undefined;
}
