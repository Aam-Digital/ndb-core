import { inject, Injectable } from "@angular/core";
import { ConfigurableEnumValue } from "../basic-datatypes/configurable-enum/configurable-enum.types";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Logging } from "../logging/logging.service";
import { SessionSubject } from "../session/auth/session-info";
import { SiteSettings } from "./site-settings";

/**
 * Settings a user has chosen for their own account, stored as a `SiteSettings`
 * document under their account id, with `SiteSettings:global` as the fallback.
 *
 * Deliberately separate from {@link SiteSettingsService}, which also applies the
 * site branding that individual users must not be able to override.
 */
@Injectable({ providedIn: "root" })
export class UserSettingsService {
  /** everything not listed here stays global and admin-controlled */
  static readonly USER_OVERRIDABLE_SETTINGS = ["defaultLanguage"] as const;

  private readonly entityMapper = inject(EntityMapperService);
  private readonly sessionInfo = inject(SessionSubject);

  private get userId(): string | undefined {
    return this.sessionInfo.value?.id;
  }

  /**
   * @param userId defaults to the logged-in user; pass it to keep a read and a
   *   following write on the same account even if the session changes between
   */
  async loadUserSettings(
    userId = this.userId,
  ): Promise<SiteSettings | undefined> {
    if (!userId) {
      return undefined;
    }

    try {
      return await this.entityMapper.load(SiteSettings, userId);
    } catch (err) {
      // no personal settings saved yet is the normal case, not an error
      Logging.debug("UserSettingsService: no settings for this user", err);
      return undefined;
    }
  }

  async getLanguage(): Promise<string | undefined> {
    const settings = await this.loadUserSettings();
    return settings?.defaultLanguage?.id;
  }

  /** Resolves once saved, so callers can reload the app afterwards. */
  async setLanguage(locale: ConfigurableEnumValue): Promise<void> {
    // read once: a session change during the load must not write this language
    // onto whoever is logged in by then
    const userId = this.userId;
    if (!userId) {
      throw new Error("Cannot save user settings without a logged-in user");
    }

    const settings =
      (await this.loadUserSettings(userId)) ?? new SiteSettings(userId);
    settings.defaultLanguage = locale;

    await this.entityMapper.save(settings);
  }
}
