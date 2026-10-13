import {
  DEFAULT_LANGUAGE,
  isRtlLocale,
  isValidLocale,
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
  const storedLocale = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);
  locale = locale ?? storedLocale ?? DEFAULT_LANGUAGE;

  if (!isValidLocale(locale)) {
    Logging.warn(
      "Discarding an invalid locale, falling back to the default language.",
      { locale },
    );
    if (storedLocale !== null && !isValidLocale(storedLocale)) {
      // otherwise the app would keep failing on every reload
      localStorage.removeItem(LANGUAGE_LOCAL_STORAGE_KEY);
    }
    return;
  }

  // deliberately before the fetch below: direction and locale data describe the
  // language itself, so they still apply when its translations are unavailable
  applyDocumentLanguage(locale);
  await registerLocaleDataFor(locale);

  if (locale === DEFAULT_LANGUAGE) {
    return;
  }

  const json = await fetchTranslations(locale);

  if (json === undefined) {
    return;
  }

  loadTranslations(json);
  $localize.locale = locale;
}

/**
 * Must run before Angular bootstraps: the CDK's `Directionality` reads `dir` once when
 * constructed, and all Angular Material components take their direction from it.
 */
function applyDocumentLanguage(locale: string): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
}

/**
 * Needed for locale-aware components & pipes (date formats, first day of week, numbers).
 * Imports are listed explicitly so only the locales we offer end up in the bundle.
 */
async function registerLocaleDataFor(locale: string): Promise<void> {
  let localeModule;
  if (locale == "de") {
    localeModule = await import("@angular/common/locales/de");
  } else if (locale == "fr") {
    localeModule = await import("@angular/common/locales/fr");
  } else if (locale == "ar") {
    localeModule = await import("@angular/common/locales/ar");
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
    // the locale is context, not part of the message: interpolated it would
    // open a separate remote-monitoring issue per locale (see logging/README.md)
    "Could not load translations for the requested locale, falling back to the default language.",
    { locale },
  );
  return undefined;
}
