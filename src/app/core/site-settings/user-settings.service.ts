import { inject, Injectable } from "@angular/core";
import { ConfigurableEnumValue } from "../basic-datatypes/configurable-enum/configurable-enum.types";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Logging } from "../logging/logging.service";
import { SessionSubject } from "../session/auth/session-info";
import { SiteSettings } from "./site-settings";

/**
 * Settings a user has chosen for their own account, stored as a `SiteSettings`
 * document under their user account id (e.g. `SiteSettings:1234-abcd`).
 *
 * The global `SiteSettings:global` document remains the fallback for anyone who
 * has not chosen a setting themselves.
 *
 * Deliberately separate from {@link SiteSettingsService}: that service also
 * applies the site branding (title, colors, font, favicon) and caches it, and
 * individual users must not be able to override those. Only the properties
 * listed in {@link USER_OVERRIDABLE_SETTINGS} are personal.
 */
@Injectable({ providedIn: "root" })
export class UserSettingsService {
  /**
   * The settings a user may choose for their own account.
   * Everything else stays global and admin-controlled.
   */
  static readonly USER_OVERRIDABLE_SETTINGS = ["defaultLanguage"] as const;

  private readonly entityMapper = inject(EntityMapperService);
  private readonly sessionInfo = inject(SessionSubject);

  /** the id of the currently logged-in user account, if there is one */
  private get userId(): string | undefined {
    return this.sessionInfo.value?.id;
  }

  /**
   * The current user's own settings, or undefined if they have not saved any
   * (or nobody is logged in).
   */
  async loadUserSettings(): Promise<SiteSettings | undefined> {
    if (!this.userId) {
      return undefined;
    }

    try {
      return await this.entityMapper.load(SiteSettings, this.userId);
    } catch (err) {
      // no personal settings saved yet is the normal case, not an error
      Logging.debug("UserSettingsService: no settings for this user", err);
      return undefined;
    }
  }

  /** The language this user chose for themselves, if any. */
  async getLanguage(): Promise<string | undefined> {
    const settings = await this.loadUserSettings();
    return settings?.defaultLanguage?.id;
  }

  /**
   * Store the language for the current user only.
   * Resolves once saved, so callers can reload the app afterwards.
   */
  async setLanguage(locale: ConfigurableEnumValue): Promise<void> {
    if (!this.userId) {
      throw new Error("Cannot save user settings without a logged-in user");
    }

    const settings =
      (await this.loadUserSettings()) ?? new SiteSettings(this.userId);
    settings.defaultLanguage = locale;

    await this.entityMapper.save(settings);
  }
}
