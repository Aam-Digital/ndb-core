import { Injectable } from "@angular/core";
import { HttpStatusCode } from "@angular/common/http";
import { shareReplay } from "rxjs/operators";
import { addDefaultNoteDetailsConfig } from "../../child-dev-project/notes/add-default-note-views";
import { addDefaultTodoViews } from "../../features/todos/add-default-todo-views";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { LatestEntityLoader } from "../entity/latest-entity-loader";
import { Logging } from "../logging/logging.service";
import { Config } from "./config";
import { ConfigMigration } from "./config-migration";
import { applyConfigMigrations } from "./config-migrations";

/**
 * Access dynamic app configuration retrieved from the database
 * that defines how the interface and data models should look.
 */
@Injectable({ providedIn: "root" })
export class ConfigService extends LatestEntityLoader<Config> {
  /**
   * sessionStorage key tracking how many times we've auto-reloaded due to a
   * config load failure, so a persistent failure (e.g. offline, backend down)
   * doesn't reload-loop and flood error monitoring - see abortWithError().
   */
  private static readonly RELOAD_ATTEMPTS_KEY = "config_load_reload_attempts";
  private static readonly MAX_RELOAD_ATTEMPTS = 1;

  /**
   * Subscribe to receive the current config and get notified whenever the config is updated.
   */
  private currentConfig: Config;

  configUpdates = this.entityUpdated.pipe(shareReplay(1));

  constructor(
    // eslint-disable-next-line
    entityMapper: EntityMapperService, // Prefer using the inject() function not possible here because base class requires the dependency to be passed to super()
  ) {
    super(Config, Config.CONFIG_KEY, entityMapper);
  }

  override onInit() {
    this.entityUpdated.subscribe(async (config) => {
      if (!config?.data || typeof config.data !== "object") {
        this.abortWithError(
          "Configuration loaded but contains no data. This may indicate a corrupt config document.",
        );
        return;
      }
      sessionStorage.removeItem(ConfigService.RELOAD_ATTEMPTS_KEY);
      this.currentConfig = this.applyMigrations(config);
      this.logConfigRev();
    });

    this.startLoading();
  }

  override async loadOnce(): Promise<Config | undefined> {
    try {
      const entity = await this.entityMapper.load(Config, Config.CONFIG_KEY);
      this.entityUpdated.next(entity);
      return entity;
    } catch (err) {
      if (err?.status === HttpStatusCode.NotFound) {
        return undefined;
      }
      this.abortWithError(
        `Failed to load configuration from the database.`,
        err,
      );
      return undefined;
    }
  }

  private abortWithError(message: string, cause?: unknown) {
    const error = new Error(message, { cause });
    error.name = "ConfigLoadError";
    Logging.error(error);

    if (this.registerReloadAttempt()) {
      alert(
        $localize`We couldn't load the configuration for your system. Trying to reload the app for you. If this problem persists, please contact your tech support.`,
      );
      window.location.reload();
    } else {
      alert(
        $localize`We couldn't load the configuration for your system, even after retrying. Please contact your tech support.`,
      );
    }
  }

  /**
   * Track auto-reload attempts for the current session and return whether
   * another reload is still allowed, to avoid an infinite reload loop
   * (e.g. while offline or during a backend outage) flooding error monitoring.
   */
  private registerReloadAttempt(): boolean {
    const attempts = Number(
      sessionStorage.getItem(ConfigService.RELOAD_ATTEMPTS_KEY) ?? "0",
    );
    if (attempts >= ConfigService.MAX_RELOAD_ATTEMPTS) {
      return false;
    }
    sessionStorage.setItem(
      ConfigService.RELOAD_ATTEMPTS_KEY,
      String(attempts + 1),
    );
    return true;
  }

  private logConfigRev() {
    Logging.addContext("Aam Digital config", {
      "config _rev": this.currentConfig._rev,
    });
  }

  public hasConfig() {
    return this.currentConfig !== undefined;
  }

  public saveConfig(config: any): Promise<void> {
    return this.entityMapper.save(new Config(Config.CONFIG_KEY, config), true);
  }

  /**
   * Export the current config as a JSON string.
   * @param rawObject If true, returns the object instead of stringified value.
   */
  public exportConfig(rawObject: true): Object;
  public exportConfig(rawObject?: false): string;
  public exportConfig(rawObject?: boolean): string | Object {
    if (!this.currentConfig?.data) {
      return rawObject ? {} : "{}";
    }
    const value = JSON.stringify(this.currentConfig.data);
    return rawObject ? JSON.parse(value) : value;
  }

  public getConfig<T>(id: string): T | undefined {
    return this.currentConfig?.data?.[id];
  }

  /**
   * Return all config items of the given "type"
   * (determined by the given prefix of their id).
   *
   * @param prefix The prefix of config items to return (e.g. "view:" or "entity:")
   */
  public getAllConfigs<T>(prefix: string): T[] {
    if (!this.currentConfig?.data) {
      return [];
    }
    const matchingConfigs = [];
    for (const id of Object.keys(this.currentConfig.data)) {
      if (id.startsWith(prefix)) {
        this.currentConfig.data[id]._id = id;
        matchingConfigs.push(this.currentConfig.data[id]);
      }
    }
    return matchingConfigs;
  }

  public applyMigrations<E>(doc: E): E {
    // default migrations that are not only temporary but will remain in the codebase
    // run first so the config-migrations.ts pipeline (which includes
    // migrateShortcutDashboardLinks/migrateNavigationMenuEntityLinks) sees these
    // default-added view configs too.
    const defaultConfigs: ConfigMigration[] = [
      addDefaultNoteDetailsConfig,
      addDefaultTodoViews,
    ];

    const withDefaults = JSON.parse(JSON.stringify(doc), (_that, rawValue) => {
      let docPart = rawValue;
      for (const migration of defaultConfigs) {
        docPart = migration(_that, docPart);
      }
      return docPart;
    });

    const migrated = applyConfigMigrations(withDefaults);

    return Object.assign(new (doc.constructor as new () => E)(), migrated);
  }
}
