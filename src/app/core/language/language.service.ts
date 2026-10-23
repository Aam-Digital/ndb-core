import { inject, Injectable, LOCALE_ID } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  DEFAULT_LANGUAGE,
  isValidLocale,
  LANGUAGE_LOCAL_STORAGE_KEY,
  LANGUAGE_OWNER_LOCAL_STORAGE_KEY,
} from "./language-statics";
import { WINDOW_TOKEN, LOCAL_STORAGE_TOKEN } from "../../utils/di-tokens";
import { SiteSettings } from "../site-settings/site-settings";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { SiteSettingsService } from "../site-settings/site-settings.service";
import { UserSettingsService } from "../site-settings/user-settings.service";
import { UserSettings } from "../site-settings/user-settings";
import {
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  of,
  timeout,
} from "rxjs";
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
  /** how long to wait for a site default before falling back to {@link DEFAULT_LANGUAGE} */
  static readonly SITE_DEFAULT_WAIT_MS = 3000;

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
    this.applyOwnLanguageOnUserSettingsUpdate();
  }

  /**
   * A user's own language lives in the database, so it can only be read once a
   * session exists.
   * Without one, the language picked on this device is kept - unless it was
   * applied from another account's settings, which a shared browser must not
   * pass on to the next user.
   */
  private applyOwnLanguageOnLogin() {
    this.sessionInfo
      .pipe(
        untilDestroyed(this),
        map((session) => session?.id),
        filter((userId) => !!userId),
        distinctUntilChanged(),
      )
      .subscribe(async (userId) => {
        if (!this.siteSettings.languageSwitchingEnabled) {
          // everyone uses the default language, so the account's own one is ignored
          this.applyDefaultLanguage(await this.getDefaultLanguage());
          return;
        }

        const ownLanguage = await this.userSettings.getLanguage();
        if (ownLanguage) {
          this.switchLocale(ownLanguage, userId);
          return;
        }

        const owner = this.localStorage.getItem(
          LANGUAGE_OWNER_LOCAL_STORAGE_KEY,
        );
        if (!owner || owner === userId) return;

        // the site settings are cached from the previous session, so a configured
        // default is available right away - only wait briefly for one that is not set
        this.switchLocale(
          (await this.getDefaultLanguage()) ?? DEFAULT_LANGUAGE,
        );
      });
  }

  /**
   * The language configured for the whole system,
   * or undefined if the site settings do not set one (within {@link SITE_DEFAULT_WAIT_MS}).
   * Callers must not assume a language then: a fresh system has none yet
   * and site settings may arrive after the wait on a slow connection.
   */
  private async getDefaultLanguage(): Promise<string | undefined> {
    const siteDefault = await firstValueFrom(
      this.siteSettings.defaultLanguage.pipe(
        map((language) => language?.id),
        timeout({
          first: LanguageService.SITE_DEFAULT_WAIT_MS,
          with: () => of(undefined),
        }),
      ),
    );
    return siteDefault || undefined;
  }

  /**
   * Make the default language the active one if language switching is disabled.
   * Does nothing if no default language is configured, so the current locale
   * (e.g. one picked in the setup assistant of a fresh system) stays as it is.
   * Unlike {@link switchLocale} this does not reload if the language is already
   * in effect, e.g. through the app default without anything stored.
   */
  private applyDefaultLanguage(language: string | undefined) {
    if (!language) return;
    this.localStorage.removeItem(LANGUAGE_OWNER_LOCAL_STORAGE_KEY);
    if (language === this.getCurrentLocale()) return;
    this.switchLocale(language);
  }

  /**
   * On a new device the user's settings only arrive with the sync after login,
   * and they may also be changed from another device, so apply them on arrival.
   */
  private applyOwnLanguageOnUserSettingsUpdate() {
    this.entityMapper
      .receiveUpdates(UserSettings)
      .pipe(
        untilDestroyed(this),
        filter(({ type }) => type !== "remove"),
        map(({ entity }) => ({
          userId: entity.getId(true),
          locale: entity.defaultLanguage?.id,
        })),
        filter(
          ({ userId, locale }) =>
            !!locale &&
            this.siteSettings.languageSwitchingEnabled &&
            userId === this.sessionInfo.value?.id,
        ),
      )
      .subscribe(({ userId, locale }) => this.switchLocale(locale, userId));
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

        if (!this.siteSettings.languageSwitchingEnabled) {
          this.applyDefaultLanguage(updatedLanguage);
          return;
        }

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
   * @param ownerId the account whose own language setting this is;
   *   leave empty for a language picked on this device or the system default
   */
  switchLocale(newLocale: string, ownerId?: string): void {
    if (newLocale && !isValidLocale(newLocale)) {
      // storing this would stringify it and break loading translations on the next reload
      Logging.warn("Ignoring an invalid locale.", { newLocale });
      return;
    }
    if (!newLocale) return;

    if (ownerId) {
      this.localStorage.setItem(LANGUAGE_OWNER_LOCAL_STORAGE_KEY, ownerId);
    } else {
      this.localStorage.removeItem(LANGUAGE_OWNER_LOCAL_STORAGE_KEY);
    }

    const currentLocale = this.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);
    if (newLocale === currentLocale) return;

    this.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, newLocale);
    this.window.location.reload();
  }

  /**
   * Switch to a language the logged-in user has just saved for their own account.
   */
  switchToOwnLocale(newLocale: string): void {
    this.switchLocale(newLocale, this.sessionInfo.value?.id);
  }

  /**
   * Apply the system default at startup. A user's own language is applied on
   * login instead (see {@link applyOwnLanguageOnLogin}).
   * If language switching is disabled, a configured default language always wins over
   * a language stored on this device. Without a configured one, the stored language stays.
   */
  initDefaultLanguage(): void {
    if (!this.siteSettings.languageSwitchingEnabled) {
      // a language picked on this device earlier must not outlast the switch being disabled
      this.getDefaultLanguage()
        .then((language) => this.applyDefaultLanguage(language))
        .catch((err) => Logging.error(err));
      return;
    }

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
