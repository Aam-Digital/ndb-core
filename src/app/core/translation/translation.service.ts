import { Inject, Injectable, LOCALE_ID } from "@angular/core";

/**
 * Service that contains
 * <li>The currently selected language
 * <li>All available languages
 */
@Injectable({
  providedIn: "root",
})
export class TranslationService {
  /**
   * A readonly array of all locales available
   * TODO: Hardcoded
   */
  readonly availableLocales: { locale: string; regionCode: string }[] = [
    { locale: "de", regionCode: "de" },
    { locale: "en-US", regionCode: "us" },
    { locale: "fr", regionCode: "fr" },
  ];

  constructor(@Inject(LOCALE_ID) private baseLocale: string) {}

  /**
   * returns the region code of the locale currently used
   * Extracts the region code (i.e. 'de', 'us', 'in') in lowercase letters
   * from a locale (i.e. 'en-US', 'hi-IN')
   */
  currentRegionCode(): string {
    const components = this.baseLocale.split("-");
    if (components.length >= 2) {
      return components[1].toLowerCase();
    } else {
      return components[0].toLowerCase();
    }
  }
}
