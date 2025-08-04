import { Injectable, LOCALE_ID, inject } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "./language-statics";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import { SiteSettings } from "../site-settings/site-settings";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { SiteSettingsService } from "../site-settings/site-settings.service";
import { filter } from "rxjs";

/**
 * Service that provides the currently active locale and applies a newly selected one.
 */
@Injectable({
  providedIn: "root",
})
@UntilDestroy()
export class LanguageService {
  private baseLocale = inject(LOCALE_ID);
  private window = inject<Window>(WINDOW_TOKEN);
  private siteSettings = inject(SiteSettingsService);
  readonly entityMapper = inject(EntityMapperService);

  constructor() {
    //Listen to SiteSettings updates and sync the default language in localStorage
    this.entityMapper
      .receiveUpdates(SiteSettings)
      .pipe(
        untilDestroyed(this),
        filter(
          (update) => update?.entity.getId(true) === SiteSettings.ENTITY_ID,
        ),
      )
      .subscribe((updatedSiteSettings) => {
        const updatedLanguage =
          updatedSiteSettings?.entity?.defaultLanguage?.id;
        const currentLanguage = localStorage.getItem(
          LANGUAGE_LOCAL_STORAGE_KEY,
        );
        if (updatedLanguage !== currentLanguage) {
          // Override the language in localStorage and reload the app
          localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, updatedLanguage);
          this.window.location.reload();
        }
      });
  }

  /**
   * For the very first load: if user hasn't chosen a language yet,
   * apply the SiteSettings default and reload.
   */
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
