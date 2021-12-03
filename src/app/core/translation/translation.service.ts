import { Inject, Injectable, LOCALE_ID } from "@angular/core";
import { extractRegionFromLocale } from "./translation-util";

/**
 * Service that contains
 * <li>The currently selected language
 * <li>All available languages
 * <br/>
 * As well as methods to change the currently selected language
 */
@Injectable({
  providedIn: "root",
})
export class TranslationService {
  /**
   * A readonly array of all locales available
   * TODO: Hardcoded
   */
  readonly availableLocales: { locale: string; regionCode: string }[] = [];
  constructor(@Inject(LOCALE_ID) private baseLocale: string) {
    this.availableLocales = [
      { locale: "de", regionCode: "de" },
      { locale: "en-US", regionCode: "us" },
      { locale: "fr", regionCode: "fr" }
    ];
  }

  /**
   * returns all available locales without region code
   * i.e. only 'en-US' instead of 'en-US' <i>and</i> 'us'
   */
  get locales(): string[] {
    return this.availableLocales.map((l) => l.locale);
  }

  /**
   * Returns the locale currently used by the user
   */
  currentLocale(): string {
    const url = window.location.pathname.split("/")[0];
    if (!this.locales.includes(url)) {
      return this.baseLocale;
    } else {
      return url;
    }
  }

  /**
   * returns the region code of the locale currently used
   */
  currentRegionCode(): string {
    return extractRegionFromLocale(this.currentLocale());
  }
}
