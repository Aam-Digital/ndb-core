import { Inject, Injectable, LOCALE_ID } from "@angular/core";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "./language-statics";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import { SiteSettingsService } from "../site-settings/site-settings.service";

/**
 * Service that provides the currently active locale and applies a newly selected one.
 */
@Injectable({
  providedIn: "root",
})
export class LanguageService {
  constructor(
    @Inject(LOCALE_ID) private baseLocale: string,
    @Inject(WINDOW_TOKEN) private window: Window,
    private siteSettings: SiteSettingsService,
  ) {}

  initDefaultLanguage(): void {
    const languageSelected = this.window.localStorage.getItem(
      LANGUAGE_LOCAL_STORAGE_KEY,
    );

    if (!languageSelected) {
      this.siteSettings.language.subscribe(({ id }) => {
        if (id !== this.baseLocale) {
          // Reload app with default language from config
          this.window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, id);
          this.window.location.reload();
        }
      });
    }
  }

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
