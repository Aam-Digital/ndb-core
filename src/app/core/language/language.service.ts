import { Inject, Injectable, LOCALE_ID } from "@angular/core";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "./language-statics";
import { UiConfig } from "../ui/ui-config";
import { ConfigService } from "../config/config.service";
import { WINDOW_TOKEN } from "../../utils/di-tokens";

/**
 * Service that contains
 * <li>The currently selected language
 * <li>All available languages
 */
@Injectable({
  providedIn: "root",
})
export class LanguageService {
  /**
   * A readonly array of all locales available
   * TODO: Hardcoded
   */
  readonly availableLocales: { locale: string; regionCode: string }[] = [
    { locale: "de", regionCode: "de" },
    { locale: "en-US", regionCode: "us" },
    { locale: "fr", regionCode: "fr" },
    { locale: "it", regionCode: "it" },
  ];

  constructor(
    @Inject(LOCALE_ID) private baseLocale: string,
    @Inject(WINDOW_TOKEN) private window: Window,
    private configService: ConfigService
  ) {}

  initDefaultLanguage(): void {
    const languageSelected = this.window.localStorage.getItem(
      LANGUAGE_LOCAL_STORAGE_KEY
    );

    if (!languageSelected) {
      this.configService.configUpdates.subscribe(() => {
        const { default_language } =
          this.configService.getConfig<UiConfig>("appConfig") ?? {};
        if (default_language && default_language !== this.baseLocale) {
          // Reload app with default language from config
          this.window.localStorage.setItem(
            LANGUAGE_LOCAL_STORAGE_KEY,
            default_language
          );
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
