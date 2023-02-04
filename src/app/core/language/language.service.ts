import { Inject, Injectable, LOCALE_ID, OnDestroy, HostListener } from "@angular/core";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "./language-statics";
import { UiConfig } from "../ui/ui-config";
import { ConfigService } from "../config/config.service";
import { WINDOW_TOKEN } from "../../utils/di-tokens";

import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

/**
 * Service that contains
 * <li>The currently selected language
 * <li>All available languages
 */
@Injectable({
  providedIn: "root",
})
export class LanguageService implements OnDestroy {
  private destroy$: Subject<any> = new Subject<any>();
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
      this.configService.configUpdates.pipe(takeUntil(this.destroy$)).subscribe(() => {
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

  @HostListener('unloaded')
  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
