import { inject, Injectable } from "@angular/core";
import { SiteSettings } from "./site-settings";
import { Observable, skipWhile } from "rxjs";
import { distinctUntilChanged, map, shareReplay } from "rxjs/operators";
import { Title } from "@angular/platform-browser";
import materialColours from "@aytek/material-color-picker";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { LatestEntityLoader } from "../entity/latest-entity-loader";
import { Logging } from "../logging/logging.service";
import { Entity } from "../entity/model/entity";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { availableLocales } from "../language/languages";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";

/**
 * Access to site settings stored in the database, like styling, site name and logo.
 */
@Injectable({
  providedIn: "root",
})
export class SiteSettingsService extends LatestEntityLoader<SiteSettings> {
  private title = inject(Title);
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
  displayLanguageSelect = this.getPropertyObservable("displayLanguageSelect");
  dateFormat = this.getPropertyObservable("dateFormat");

  constructor() {
    const entityMapper = inject(EntityMapperService);

    super(SiteSettings, SiteSettings.ENTITY_ID, entityMapper);

    this.init();

    super.startLoading();
  }

  init() {
    this.initAvailableLocales();

    this.siteName.subscribe((name) => this.title.setTitle(name));
    this.subscribeFontChanges();
    this.subscribeColorChanges("primary");
    this.subscribeColorChanges("secondary");
    this.subscribeColorChanges("error");
    this.subscribeDateFormatChanges();

    this.initFromLocalStorage();
    this.cacheInLocalStorage();
  }

  /**
   * Making locales enum available at runtime
   * so that UI can show dropdown options
   * @private
   */
  private initAvailableLocales() {
    this.enumService["cacheEnum"](availableLocales);
  }

  /**
   * Do an initial loading of settings from localStorage, if available.
   * @private
   */
  private initFromLocalStorage() {
    let localStorageSettings: SiteSettings;

    try {
      const stored = localStorage.getItem(this.SITE_SETTINGS_LOCAL_STORAGE_KEY);
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
      localStorage.setItem(
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
      }
    });
  }

  private subscribeDateFormatChanges() {
    // Import the setGlobalDateFormat function dynamically to avoid circular dependency
    import("../basic-datatypes/date/date.static").then((module) => {
      this.dateFormat.subscribe((format) => {
        if (format) {
          module.setGlobalDateFormat(format);
        }
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
