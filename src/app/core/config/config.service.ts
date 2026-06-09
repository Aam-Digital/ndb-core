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
import {
  CONFIG_ENTITY_ROUTE_PREFIX,
  normalizeRoutePath,
} from "./dynamic-routing/route-paths";
import { PREFIX_VIEW_CONFIG } from "./dynamic-routing/view-config.interface";

/**
 * Access dynamic app configuration retrieved from the database
 * that defines how the interface and data models should look.
 */
@Injectable({ providedIn: "root" })
export class ConfigService extends LatestEntityLoader<Config> {
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
    alert(
      $localize`We couldn't load the configuration for your system. Trying to reload the app for you. If this problem persists, please contact your tech support.`,
    );
    window.location.reload();
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
    const defaultConfigs: ConfigMigration[] = [
      addDefaultNoteDetailsConfig,
      addDefaultTodoViews,
      migrateShortcutDashboardLinks,
      migrateNavigationMenuEntityLinks, // must run last to see all default-added view configs
    ];

    const migrated = applyConfigMigrations(doc);

    const newDoc = JSON.parse(JSON.stringify(migrated), (_that, rawValue) => {
      let docPart = rawValue;
      for (const migration of defaultConfigs) {
        docPart = migration(_that, docPart);
      }
      return docPart;
    });

    return Object.assign(new (doc.constructor as new () => E)(), newDoc);
  }
}

/**
 * Migrate ShortcutDashboard widget `link` values that point to entity routes
 * to use the runtime `/c/` prefix.
 */
const migrateShortcutDashboardLinks: ConfigMigration = (key, configPart) => {
  if (
    key !== "" ||
    !configPart?.data ||
    typeof configPart.data !== "object" ||
    Array.isArray(configPart.data)
  ) {
    return configPart;
  }

  const data = configPart.data;
  const entityBasePaths = buildEntityBasePaths(data);
  if (entityBasePaths.size === 0) return configPart;

  for (const dataKey of Object.keys(data)) {
    if (!dataKey.startsWith(PREFIX_VIEW_CONFIG)) continue;
    const viewConfig = data[dataKey];
    if (!Array.isArray(viewConfig?.config?.widgets)) continue;
    for (const widget of viewConfig.config.widgets) {
      if (
        widget.component === "ShortcutDashboard" &&
        Array.isArray(widget.config?.shortcuts)
      ) {
        widget.config.shortcuts = widget.config.shortcuts.map(
          (shortcut: any) => migrateShortcutItem(shortcut, entityBasePaths),
        );
      }
    }
  }

  return configPart;
};

function buildEntityBasePaths(data: Record<string, any>): Set<string> {
  const paths = new Set<string>();
  for (const key of Object.keys(data)) {
    if (!key.startsWith(PREFIX_VIEW_CONFIG)) continue;
    const path = key.substring(PREFIX_VIEW_CONFIG.length);
    if (!path || path.includes("/:id")) continue;
    const viewConfig = data[key];
    if (viewConfig?.config?.entityType || viewConfig?.config?.entity) {
      paths.add(path);
    }
  }
  return paths;
}

function migrateShortcutItem(item: any, entityBasePaths: Set<string>): any {
  if (!item.link || item.link.startsWith(`/${CONFIG_ENTITY_ROUTE_PREFIX}/`)) {
    return item;
  }
  const normalizedLink = normalizeRoutePath(item.link);
  const segments = normalizedLink.split("/");
  for (let i = segments.length; i >= 1; i--) {
    const base = segments.slice(0, i).join("/");
    if (entityBasePaths.has(base)) {
      return {
        ...item,
        link: `/${CONFIG_ENTITY_ROUTE_PREFIX}/${normalizedLink}`,
      };
    }
  }
  return item;
}

/**
 * Migrate navigationMenu items that use a hardcoded entity route `link` to the `entityType` format.
 */
const migrateNavigationMenuEntityLinks: ConfigMigration = (key, configPart) => {
  if (
    key !== "" ||
    !configPart?.data ||
    typeof configPart.data !== "object" ||
    Array.isArray(configPart.data) ||
    !Array.isArray(configPart.data?.navigationMenu?.items)
  ) {
    return configPart;
  }

  configPart.data.navigationMenu.items = migrateNavMenuItems(
    configPart.data.navigationMenu.items,
    configPart.data,
  );
  return configPart;
};

function migrateNavMenuItems(items: any[], data: Record<string, any>): any[] {
  return items.map((item) => {
    const migrated = migrateNavMenuItem(item, data);
    if (migrated.subMenu) {
      migrated.subMenu = migrateNavMenuItems(migrated.subMenu, data);
    }
    return migrated;
  });
}

function migrateNavMenuItem(item: any, data: Record<string, any>): any {
  if (!item.link || item.entityType) return item;

  const normalizedPath = normalizeRoutePath(item.link);
  const viewConfig = data[`${PREFIX_VIEW_CONFIG}${normalizedPath}`];
  const entityType =
    viewConfig?.config?.entityType || viewConfig?.config?.entity;

  if (!entityType) return item;

  const { link: _removed, ...rest } = item;
  return { ...rest, entityType };
}
