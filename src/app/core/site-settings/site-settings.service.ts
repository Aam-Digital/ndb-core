import { computed, inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { SiteSettings } from "./site-settings";
import { Observable, skipWhile } from "rxjs";
import { distinctUntilChanged, map, shareReplay, take } from "rxjs/operators";
import { Title } from "@angular/platform-browser";
import materialColours from "@aytek/material-color-picker";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { LatestEntityLoader } from "../entity/latest-entity-loader";
import { Logging } from "../logging/logging.service";
import { Entity } from "../entity/model/entity";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { availableLocales } from "../language/languages";
import { ConfigurableEnumValue } from "../basic-datatypes/configurable-enum/configurable-enum.types";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";
import { EntityConfigReadyService } from "../entity/entity-config-ready.service";
import { environment } from "../../../environments/environment";
import { hasRemoteSession } from "../session/session-type";
import { LOCAL_STORAGE_TOKEN } from "../../utils/di-tokens";
import { isConnectivityError } from "../../utils/connectivity-error";

/**
 * Access to site settings stored in the database, like styling, site name and logo.
 */
@Injectable({
  providedIn: "root",
})
export class SiteSettingsService extends LatestEntityLoader<SiteSettings> {
  private title = inject(Title);
  private readonly localStorage = inject(LOCAL_STORAGE_TOKEN);
  private schemaService = inject(EntitySchemaService);
  private enumService = inject(ConfigurableEnumService);

  readonly DEFAULT_FAVICON = "favicon.ico";
  readonly SITE_SETTINGS_LOCAL_STORAGE_KEY = Entity.createPrefixedId(
    SiteSettings.ENTITY_TYPE,
    SiteSettings.ENTITY_ID,
  );

  siteSettings = this.entityUpdated.pipe(shareReplay(1));

  siteName = this.getPropertyObservable("siteName");
  defaultLanguage = this.getPropertyObservable("defaultLanguage");
  dateFormat = this.getPropertyObservable("dateFormat");

  /**
   * Whether users may switch the app's language themselves. If not, everyone uses
   * the system language ({@link defaultLanguage}). Bound to the deployment's
   * `multiLingualConfigEnabled` flag, read at runtime because `config.json` overwrites it.
   */
  get languageSwitchingEnabled(): boolean {
    return !!environment.multiLingualConfigEnabled;
  }

  /**
   * The enabled languages of this system: the system language ({@link defaultLanguage})
   * plus the admin's selection (`availableLocales`). Order: the stored selection first,
   * the system language appended if it is not part of it. It is added here at read time,
   * so changing the system language needs no data fix-up.
   *
   * So an empty selection enables only the system language. Only if neither a selection
   * nor a system language is set (system not set up yet, or settings not loaded yet)
   * are all languages enabled. Never returns an empty list.
   */
  readonly enabledLocales = toSignal(
    this.siteSettings.pipe(
      map((settings) => {
        const selected = settings?.availableLocales ?? [];
        const systemLanguage = settings?.defaultLanguage;
        if (!systemLanguage?.id) {
          return selected.length ? selected : availableLocales.values;
        }
        return selected.some(({ id }) => id === systemLanguage.id)
          ? selected
          : [...selected, systemLanguage];
      }),
    ),
    { initialValue: availableLocales.values },
  );

  /**
   * Whether the UI to configure texts in several languages is shown (the translations
   * buttons of admin forms). Requires the `multiLingualConfigEnabled` flag AND more than
   * one enabled language: if only the system language is enabled, there is nothing to
   * translate into. Texts already stored per language are resolved and kept as always.
   */
  readonly translationsEnabled = computed(
    () => this.languageSwitchingEnabled && this.enabledLocales().length > 1,
  );

  private entityConfigReady = inject(EntityConfigReadyService);

  constructor() {
    const entityMapper = inject(EntityMapperService);

    super(SiteSettings, SiteSettings.ENTITY_ID, entityMapper);

    this.init();

    // Try an immediate best-effort load for login/anonymous screens. Some
    // systems allow unauthenticated read access to SiteSettings.
    this.tryLoadEarly();

    // Wait for dynamic entity schemas to be applied before loading from DB,
    // so config-defined SiteSettings fields are transformed correctly.
    this.entityConfigReady.setupCompleted$.pipe(take(1)).subscribe(() => {
      super.startLoading().catch((err) => {
        Logging.error("Failed to load site settings", err);
      });
    });
  }

  private tryLoadEarly() {
    this.tryLoadFromAnonymousRemote().catch((err) => {
      // This is optional and can fail pre-login (e.g. no anonymous read access).
      Logging.debug("SiteSettingsService: early load skipped", err);
    });
  }

  private async tryLoadFromAnonymousRemote() {
    if (!hasRemoteSession(environment.session_type)) {
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    const documentId = encodeURIComponent(this.SITE_SETTINGS_LOCAL_STORAGE_KEY);
    const url = `${environment.DB_PROXY_PREFIX}/${SiteSettings.DATABASE}/${documentId}`;
    const response = await fetch(url, {
      headers: { "ngsw-bypass": "true" },
    });

    if (!response.ok) {
      // Pre-login access may be unavailable by design. Keep this best-effort only.
      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 404
      ) {
        return;
      }
      const failure = { status: response.status };
      if (isConnectivityError(failure)) {
        // a gateway error: the server could not be reached (e.g. during a deployment)
        Logging.debug(
          "SiteSettingsService: anonymous fetch failed (connectivity)",
          failure,
        );
        return;
      }
      Logging.warn("SiteSettingsService: anonymous fetch failed", failure);
      return;
    }

    const rawSettings = await response.json();
    const settings = this.schemaService.loadDataIntoEntity(
      new SiteSettings(),
      rawSettings,
    );
    this.entityUpdated.next(settings);
  }

  init() {
    this.cacheLocalesEnum();

    this.siteName.subscribe((name) => this.title.setTitle(name));
    this.subscribeFontChanges();
    this.subscribeColorChanges("primary");
    this.subscribeColorChanges("secondary");
    this.subscribeColorChanges("error");
    this.subscribeDateFormatChanges();

    // Apply cached branding early so login/setup screens use the latest known theme.
    this.initFromLocalStorage();
    this.cacheInLocalStorage();
  }

  /**
   * Make the given language the system language for all users,
   * keeping the other site settings (a new settings document is created if none exists yet).
   * Resolves once saved.
   */
  async setDefaultLanguage(locale: ConfigurableEnumValue): Promise<void> {
    // a failure other than "does not exist" must not end up replacing the existing settings
    const settings = (await this.loadOnce()) ?? new SiteSettings();
    settings.defaultLanguage = locale;
    await this.entityMapper.save(settings);
  }

  /**
   * Cache the full locales enum, so dropdowns can render their options.
   * Deliberately unfiltered: the admin picks from it which ones to enable, so
   * narrowing it here would make the choice impossible to widen again.
   */
  private cacheLocalesEnum() {
    this.enumService["cacheEnum"](availableLocales);
  }

  /**
   * Do an initial loading of settings from localStorage, if available.
   * @private
   */
  private initFromLocalStorage() {
    let localStorageSettings: SiteSettings;

    try {
      const stored = this.localStorage.getItem(
        this.SITE_SETTINGS_LOCAL_STORAGE_KEY,
      );
      if (stored) {
        localStorageSettings = this.schemaService.loadDataIntoEntity(
          new SiteSettings(),
          JSON.parse(stored),
        );
      }
    } catch (e) {
      Logging.debug(
        "SiteSettingsService: could not parse settings from localStorage: " + e,
      );
    }

    if (localStorageSettings) {
      this.entityUpdated.next(localStorageSettings);
    }
  }

  /**
   * Store the latest SiteSettings in localStorage to be available before login also.
   * @private
   */
  private cacheInLocalStorage() {
    this.entityUpdated.subscribe((settings) => {
      const dbFormat =
        this.schemaService.transformEntityToDatabaseFormat(settings);
      this.localStorage.setItem(
        this.SITE_SETTINGS_LOCAL_STORAGE_KEY,
        JSON.stringify(dbFormat),
      );
    });
  }

  private subscribeFontChanges() {
    this.getPropertyObservable("font").subscribe((font) =>
      document.documentElement.style.setProperty("--font-family", font),
    );
  }

  private subscribeColorChanges(property: "primary" | "secondary" | "error") {
    this.getPropertyObservable(property).subscribe((color) => {
      if (color) {
        try {
          const palette = materialColours(color);
          palette["A100"] = palette["200"];
          palette["A200"] = palette["300"];
          palette["A400"] = palette["500"];
          palette["A700"] = palette["800"];
          Object.entries(palette).forEach(([key, value]) =>
            document.documentElement.style.setProperty(
              `--${property}-${key}`,
              `#${value}`,
            ),
          );
        } catch (e) {
          Logging.warn("SiteSettingsService: invalid color value", {
            property,
            color,
            error: e,
          });
        }
      }
    });
  }

  private subscribeDateFormatChanges() {
    import("../basic-datatypes/date/date.static").then((dateModule) => {
      this.dateFormat.subscribe((format) => {
        // Fall back to default when stored value is blank or corrupt
        const formatToApply = format?.trim() || dateModule.defaultDateFormat();
        dateModule.setGlobalDateFormat(formatToApply);
      });
    });
  }

  getPropertyObservable<P extends keyof SiteSettings>(
    property: P,
  ): Observable<SiteSettings[P]> {
    return this.siteSettings.pipe(
      skipWhile((v) => !v[property]),
      map((s) => s[property]),
      distinctUntilChanged(),
    );
  }
}
