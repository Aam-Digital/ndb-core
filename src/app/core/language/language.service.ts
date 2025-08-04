import { inject, Injectable, LOCALE_ID } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "./language-statics";
import { WINDOW_TOKEN } from "../../utils/di-tokens";
import { SiteSettings } from "../site-settings/site-settings";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { SiteSettingsService } from "../site-settings/site-settings.service";
import { filter } from "rxjs";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";

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
  private readonly entityMapper = inject(EntityMapperService);

  constructor() {
    this.switchLocaleOnSiteSettingsUpdate();
  }

  /**
   * Listen to SiteSettings entity updates
   * and trigger a switch to the new default language if it has changed.
   * (Users often do not have a language switcher in the UI to control this otherwise)
   * @private
   */
  private switchLocaleOnSiteSettingsUpdate() {
    this.entityMapper
      .receiveUpdates(SiteSettings)
      .pipe(
        untilDestroyed(this),
        filter((u) => u?.entity.getId(true) === SiteSettings.ENTITY_ID),
      )
      .subscribe((updatedSettings: UpdatedEntity<SiteSettings>) => {
        const updatedLanguage = updatedSettings?.entity?.defaultLanguage?.id;
        this.switchLocale(updatedLanguage);
      });
  }

  /**
   * Switch the current locale and persist it in localStorage.
   * @param newLocale
   */
  switchLocale(newLocale: string): void {
    const currentLocale = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);
    if (newLocale === currentLocale) return;

    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, newLocale);
    this.window.location.reload();
  }

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
