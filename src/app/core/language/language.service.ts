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
      this.siteSettings.defaultLanguage.subscribe(({ id }) => {
        if (id !== this.baseLocale) {
          // Reload app with default language from config
          this.window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, id);
          this.window.location.reload();
        }
      });
    }
  }

  /**
   * Returns the current locale string (e.g., 'en-US', 'hi-IN').
   * First tries to read the value from localStorage, otherwise falls back to base locale.
   */
  getCurrentLocale(): string {
    return (
      this.window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) ||
      this.baseLocale
    );
  }
}
