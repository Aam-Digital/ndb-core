import { inject, Injectable, LOCALE_ID } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { LANGUAGE_LOCAL_STORAGE_KEY } from "./language-statics";
import { WINDOW_TOKEN, LOCAL_STORAGE_TOKEN } from "../../utils/di-tokens";
import { SiteSettings } from "../site-settings/site-settings";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { SiteSettingsService } from "../site-settings/site-settings.service";
import { UserSettingsService } from "../site-settings/user-settings.service";
import { distinctUntilChanged, filter, firstValueFrom, map } from "rxjs";
import { UpdatedEntity } from "#src/app/core/entity/model/entity-update";
import { Logging } from "../logging/logging.service";
import { SessionSubject } from "../session/auth/session-info";

/**
 * Service that provides the currently active locale and applies a newly selected one.
 */
@Injectable({
  providedIn: "root",
})
@UntilDestroy()
export class LanguageService {
  private readonly localStorage = inject(LOCAL_STORAGE_TOKEN);
  private baseLocale = inject(LOCALE_ID);
  private window = inject<Window>(WINDOW_TOKEN);
  private siteSettings = inject(SiteSettingsService);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly userSettings = inject(UserSettingsService);
  private readonly sessionInfo = inject(SessionSubject);

  constructor() {
    this.switchLocaleOnSiteSettingsUpdate();
    this.applyOwnLanguageOnLogin();
  }

  /**
   * A user's own language lives in the database, so it can only be read once a
   * session exists. Resolving on every login also stops a shared browser from
   * keeping the previous user's choice.
   */
  private applyOwnLanguageOnLogin() {
    this.sessionInfo
      .pipe(
        untilDestroyed(this),
        map((session) => session?.id),
        filter((userId) => !!userId),
        distinctUntilChanged(),
      )
      .subscribe(async () => {
        const ownLanguage = await this.userSettings.getLanguage();
        if (ownLanguage) {
          this.switchLocale(ownLanguage);
          return;
        }

        // fall back to the system default, not the previous user's choice
        try {
          const siteDefault = await firstValueFrom(
            this.siteSettings.defaultLanguage,
          );
          this.switchLocale(siteDefault?.id);
        } catch (err) {
          Logging.debug("No site default language to fall back to", err);
        }
      });
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
      .subscribe(async (updatedSettings: UpdatedEntity<SiteSettings>) => {
        const updatedLanguage = updatedSettings?.entity?.defaultLanguage?.id;
        if (!updatedLanguage) return;

        // users who picked a language for their own account keep it
        const ownLanguage = await this.userSettings.getLanguage();
        if (ownLanguage) return;

        this.switchLocale(updatedLanguage);
      });
  }

  /**
   * Switch the current locale and persist it in this.localStorage.
   * @param newLocale
   */
  switchLocale(newLocale: string): void {
    const currentLocale = this.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);
    if (newLocale === currentLocale || !newLocale) return;

    this.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, newLocale);
    this.window.location.reload();
  }

  /**
   * Apply the system default at startup. A user's own language is applied on
   * login instead (see {@link applyOwnLanguageOnLogin}).
   */
  async initDefaultLanguage(): Promise<void> {
    const languageSelected = this.localStorage.getItem(
      LANGUAGE_LOCAL_STORAGE_KEY,
    );
    if (languageSelected) return;

    this.siteSettings.defaultLanguage.subscribe(({ id }) => {
      this.switchLocale(id);
    });
  }

  /**
   * Returns the current locale string (e.g., 'en-US', 'hi-IN').
   * First tries to read the value from localStorage, otherwise falls back to base locale.
   */
  getCurrentLocale(): string {
    return (
      this.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) || this.baseLocale
    );
  }
}
