import { Injectable } from "@angular/core";
import { HttpStatusCode } from "@angular/common/http";
import { RELATED_ENTITIES_DEFAULT_CONFIGS } from "app/utils/related-entities-default-config";
import { shareReplay } from "rxjs/operators";
import { addDefaultNoteDetailsConfig } from "../../child-dev-project/notes/add-default-note-views";
import { addDefaultTodoViews } from "../../features/todos/add-default-todo-views";
import { migrateInheritedFieldConfig } from "../../features/inherited-field/inherited-field-config-migration";
import { EntityDatatype } from "../basic-datatypes/entity/entity.datatype";
import { DefaultValueConfig } from "../default-values/default-value-config";
import { PanelComponent } from "../entity-details/EntityDetailsConfig";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { LoaderMethod } from "../entity/entity-special-loader/entity-special-loader.service";
import { LatestEntityLoader } from "../entity/latest-entity-loader";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../entity/schema/entity-schema-field";
import { Logging } from "../logging/logging.service";
import { Config } from "./config";
import { ConfigMigration } from "./config-migration";
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
    const migrations: ConfigMigration[] = [
      migrateEntityDetailsInputEntityType,
      migrateEntityArrayDatatype,
      migrateEntitySchemaDefaultValue,
      migrateChildrenListConfig,
      migrateHistoricalDataComponent,
      migratePhotoDatatype,
      migratePercentageDatatype,
      migrateEntityBlock,
      migrateGroupByConfig,
      migrateLegacyIdFilters,
      migrateDefaultValue,
      migrateInheritedFieldConfig,
      migrateUserEntityAndPanels,
      migrateComponentEntityTypeDefaults,
      removeOutdatedTodoViews,
      migrateChildSchoolOverviewComponent,
      migrateEditDescriptionOnly,
      migrateEditAttendanceComponent,
      migrateNotesManagerComponent,
      removeConfigRoutesMigratedToFixedFeatures,
      migrateAttendanceRecurringActivityRoute,
    ];

    // default migrations that are not only temporary but will remain in the codebase
    const defaultConfigs: ConfigMigration[] = [
      addDefaultNoteDetailsConfig,
      addDefaultTodoViews,
      migrateShortcutDashboardLinks,
      migrateNavigationMenuEntityLinks, // must run last to see all default-added view configs
    ];

    const newDoc = JSON.parse(JSON.stringify(doc), (_that, rawValue) => {
      let docPart = rawValue;
      for (const migration of migrations.concat(defaultConfigs)) {
        docPart = migration(_that, docPart);
      }
      return docPart;
    });

    return Object.assign(new (doc.constructor as new () => E)(), newDoc);
  }
}

const migrateFormFieldConfigView2ViewComponent: ConfigMigration = (
  key,
  configPart,
) => {
  if (
    !(key === "columns" || key === "fields" || key === "cols") &&
    key !== null
  ) {
    return configPart;
  }

  if (Array.isArray(configPart)) {
    return configPart.map((c) =>
      migrateFormFieldConfigView2ViewComponent(null, c),
    );
  }

  if (configPart?.view) {
    configPart.viewComponent = configPart.view;
    delete configPart.view;
  }
  if (configPart?.edit) {
    configPart.editComponent = configPart.edit;
    delete configPart.edit;
  }
  return configPart;
};

/**
 * Config properties specifying an entityType should be named "entityType" rather than "entity"
 * to avoid confusion with a specific instance of an entity being passed in components.
 * @param key
 * @param configPart
 */
const migrateEntityDetailsInputEntityType: ConfigMigration = (
  key,
  configPart,
) => {
  if (key !== "config") {
    return configPart;
  }

  if (configPart["entity"]) {
    configPart["entityType"] = configPart["entity"];
    delete configPart["entity"];
  }

  return configPart;
};

/**
 * Replace custom "entity-array" dataType with dataType="array", innerDatatype="entity"
 * @param key
 * @param configPart
 */
const migrateEntityArrayDatatype: ConfigMigration = (key, configPart) => {
  if (configPart === "DisplayEntityArray") {
    return "DisplayEntity";
  }

  if (!configPart?.hasOwnProperty("dataType")) {
    return configPart;
  }

  const config: EntitySchemaField = configPart;
  if (config.dataType === "entity-array") {
    config.dataType = EntityDatatype.dataType;
    config.isArray = true;
  }

  if (config.dataType === "array") {
    config.dataType = config["innerDataType"];
    delete config["innerDataType"];
    config.isArray = true;
  }

  if (config.dataType === "configurable-enum" && config["innerDataType"]) {
    config.additional = config["innerDataType"];
    delete config["innerDataType"];
  }

  return configPart;
};

/** Migrate the "file" datatype to use the new "photo" datatype  and remove editComponent if no longer needed */
const migratePhotoDatatype: ConfigMigration = (key, configPart) => {
  if (
    configPart?.dataType === "file" &&
    configPart?.editComponent === "EditPhoto"
  ) {
    configPart.dataType = "photo";
    delete configPart.editComponent;
  }
  return configPart;
};

/** Migrate the number datatype to use the new "percentage" datatype */
const migratePercentageDatatype: ConfigMigration = (key, configPart) => {
  if (
    configPart?.dataType === "number" &&
    configPart?.viewComponent === "DisplayPercentage"
  ) {
    configPart.dataType = "percentage";
    delete configPart.viewComponent;
    delete configPart.editComponent;
  }

  return configPart;
};

const migrateEntitySchemaDefaultValue: ConfigMigration = (
  key: string,
  configPart: any,
): any => {
  if (key !== "defaultValue") {
    return configPart;
  }

  if (typeof configPart == "object") {
    return configPart;
  }

  let placeholderValue: string | undefined = Object.values(PLACEHOLDERS).find(
    (value) => value === configPart,
  );

  if (placeholderValue) {
    return {
      mode: "dynamic",
      value: placeholderValue,
    } as DefaultValueConfig;
  }

  return {
    mode: "static",
    value: configPart,
  } as DefaultValueConfig;
};

const migrateChildrenListConfig: ConfigMigration = (key, configPart) => {
  if (
    typeof configPart !== "object" ||
    configPart?.["component"] !== "ChildrenList"
  ) {
    return configPart;
  }

  configPart["component"] = "EntityList";

  configPart["config"] = configPart["config"] ?? {};
  configPart["config"]["entityType"] = "Child";
  configPart["config"]["loaderMethod"] = "ChildrenService";

  return configPart;
};

const migrateHistoricalDataComponent: ConfigMigration = (key, configPart) => {
  if (
    typeof configPart !== "object" ||
    configPart?.["component"] !== "HistoricalDataComponent"
  ) {
    return configPart;
  }

  configPart["component"] = "RelatedEntities";

  configPart["config"] = configPart["config"] ?? {};
  if (Array.isArray(configPart["config"])) {
    configPart["config"] = { columns: configPart["config"] };
  }
  configPart["config"]["entityType"] = "HistoricalEntityData";
  configPart["config"]["loaderMethod"] = LoaderMethod.HistoricalDataService;

  return configPart;
};

/**
 * ChildBlockComponent was removed and entity types can instead define a configurable tooltip setting.
 */
const migrateEntityBlock: ConfigMigration = (key, configPart) => {
  if (configPart?.["blockComponent"] === "ChildBlock") {
    delete configPart["blockComponent"];
    configPart["toBlockDetailsAttributes"] = {
      title: "name",
      image: "photo",
      fields: ["phone", "schoolId", "schoolClass"],
    };

    return configPart;
  }

  if (key === "viewComponent" && configPart === "ChildBlock") {
    return "EntityBlock";
  }

  return configPart;
};

const migrateGroupByConfig: ConfigMigration = (key, configPart) => {
  // Check if we are working with the EntityCountDashboard component and within the 'config' object
  if (
    configPart?.component === "EntityCountDashboard" &&
    typeof configPart?.config?.groupBy === "string"
  ) {
    configPart.config.groupBy = [configPart.config.groupBy]; // Wrap groupBy as an array
    return configPart;
  }

  // Return the unchanged part if no modification is needed
  return configPart;
};

/**
 * Migrate legacy ".id" filter keys in OR clauses to the current filter format.
 * Example:
 * { $or: [{ "projectStatus.id": "A" }, { "projectStatus.id": "B" }] }
 *   -> { $or: [{ projectStatus: "A" }, { projectStatus: "B" }] }
 */
type OrFilterCondition = Record<string, unknown>;
type LegacyOrFilterConfig = Record<string, unknown> & {
  $or: OrFilterCondition[];
};

const migrateLegacyIdFilters: ConfigMigration = (key, configPart) => {
  if (!configPart || typeof configPart !== "object") {
    return configPart;
  }

  // This migration only applies to OR-filter objects.
  const orConditions = (configPart as LegacyOrFilterConfig)["$or"];
  if (!Array.isArray(orConditions)) {
    return configPart;
  }

  const migratedConditions = orConditions.map((orCondition) => {
    if (!orCondition || typeof orCondition !== "object") {
      return orCondition;
    }

    let hasLegacyIdKey = false;
    const normalizedEntries = Object.entries(orCondition).map(
      ([key, value]) => {
        if (key.endsWith(".id")) {
          hasLegacyIdKey = true;
          return [key.slice(0, -3), value] as const;
        }

        return [key, value] as const;
      },
    );

    return hasLegacyIdKey
      ? (Object.fromEntries(normalizedEntries) as OrFilterCondition)
      : orCondition;
  });

  configPart["$or"] = migratedConditions;
  return configPart;
};

/**
 * The DefaultValueConfig `mode` "inherited" has been renamed to "inherited-from-referenced-entity"
 * and structure moved into a "config" subproperty.
 */
const migrateDefaultValue: ConfigMigration = (key, configPart) => {
  if (key !== "defaultValue") {
    return configPart;
  }

  if (configPart?.mode === "inherited") {
    configPart.mode = "inherited-from-referenced-entity";
  }

  if (!configPart.config) {
    configPart.config = {};
    if (configPart.value) {
      configPart.config.value = configPart.value;
      delete configPart.value;
    }
    if (configPart.localAttribute) {
      configPart.config.localAttribute = configPart.localAttribute;
      delete configPart.localAttribute;
    }
    if (configPart.field) {
      configPart.config.field = configPart.field;
      delete configPart.field;
    }
  }

  return configPart;
};

/**
 * Migration to enable user account features by setting the `enableUserAccounts` flag
 * and remove the UserSecurity panel from view:user/:id.
 */
const migrateUserEntityAndPanels: ConfigMigration = (key, configPart) => {
  if (key === "entity:User") {
    configPart.enableUserAccounts = true;
  }

  if (key === "view:user/:id") {
    configPart.config.panels = (configPart.config.panels || []).filter(
      (panel) =>
        !panel.components?.some(
          (c: PanelComponent) => c.component === "UserSecurity",
        ),
    );
  }

  return configPart;
};

/**
 * Migration to set or update entityType for specific components
 */
const migrateComponentEntityTypeDefaults: ConfigMigration = (
  key,
  configPart,
) => {
  if (typeof configPart !== "object" || !configPart?.component) {
    return configPart;
  }

  if (!configPart.config) {
    configPart.config = {};
  }

  const defaults = RELATED_ENTITIES_DEFAULT_CONFIGS[configPart.component];
  if (defaults) {
    configPart.config.entityType = defaults.entityType;
    if (
      !Array.isArray(configPart.config.columns) ||
      configPart.config.columns.length === 0
    ) {
      configPart.config.columns = defaults.columns;
    }
  }

  return configPart;
};

/* Remove outdated task view configs
 * to fall back to the new default that is automatically added.
 */
const removeOutdatedTodoViews: ConfigMigration = (key, configPart) => {
  if (
    configPart?.component === "TodoList" ||
    configPart?.component === "TodoDetails"
  ) {
    return undefined; // remove this config
  }

  return configPart;
};

const removeConfigRoutesMigratedToFixedFeatures: ConfigMigration = (
  key,
  configPart,
) => {
  if (
    key !== "" ||
    !configPart?.data ||
    typeof configPart.data !== "object" ||
    Array.isArray(configPart.data)
  ) {
    return configPart;
  }

  delete configPart.data["view:import"];
  delete configPart.data["view:review-duplicates"];
  return configPart;
};

/**
 * The RecurringActivity entity list was previously nested under the attendance feature module path
 * (`view:attendance/recurring-activity`). It is now a standalone entity route (`view:recurring-activity`).
 * Also rewrites any hardcoded nav menu links so `migrateNavigationMenuEntityLinks` can convert them.
 */
const migrateAttendanceRecurringActivityRoute: ConfigMigration = (
  key,
  configPart,
) => {
  if (
    key !== "" ||
    !configPart?.data ||
    typeof configPart.data !== "object" ||
    Array.isArray(configPart.data)
  ) {
    return configPart;
  }

  const data = configPart.data;
  const OLD_LIST = "view:attendance/recurring-activity";
  const OLD_DETAILS = "view:attendance/recurring-activity/:id";
  const NEW_LIST = "view:recurring-activity";
  const NEW_DETAILS = "view:recurring-activity/:id";

  if (data[OLD_LIST] && !data[NEW_LIST]) {
    data[NEW_LIST] = data[OLD_LIST];
    delete data[OLD_LIST];
  } else {
    delete data[OLD_LIST];
  }

  if (data[OLD_DETAILS] && !data[NEW_DETAILS]) {
    data[NEW_DETAILS] = data[OLD_DETAILS];
    delete data[OLD_DETAILS];
  } else {
    delete data[OLD_DETAILS];
  }

  // Rewrite any hardcoded nav links so the navigation migration can pick them up
  if (Array.isArray(data?.navigationMenu?.items)) {
    data.navigationMenu.items = rewriteNavMenuLinks(
      data.navigationMenu.items,
      "/attendance/recurring-activity",
      "/recurring-activity",
    );
  }

  // Update entity:RecurringActivity.route if it still points to the old nested path
  if (
    data["entity:RecurringActivity"]?.route === "attendance/recurring-activity"
  ) {
    data["entity:RecurringActivity"].route = "recurring-activity";
  }

  return configPart;
};

function rewriteNavMenuLinks(
  items: any[],
  oldLink: string,
  newLink: string,
): any[] {
  return items.map((item) => {
    if (item.link === oldLink) {
      item = { ...item, link: newLink };
    }
    if (item.subMenu) {
      item.subMenu = rewriteNavMenuLinks(item.subMenu, oldLink, newLink);
    }
    return item;
  });
}

/**
 * Migrate ShortcutDashboard widget `link` values that point to entity routes
 * to use the runtime `/c/` prefix.
 * Detects entity routes by looking up matching view configs with `entityType` in the same document.
 * Non-entity links (e.g. `/attendance/add-day`, `/import`) are left unchanged.
 * Runs at the root Config document level to have access to all view configs.
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
        widget.config.shortcuts = widget.config.shortcuts.map((shortcut: any) =>
          migrateShortcutItem(shortcut, entityBasePaths),
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
 * Replace deprecated `ChildSchoolOverview`/`PreviousSchools`/`ChildrenOverview`
 * components with `RelatedEntities` using ChildSchoolRelation entity.
 * - If a config exists, only replace the component string.
 * - If config is missing, replace the entire component with the default config.
 */
const migrateChildSchoolOverviewComponent: ConfigMigration = (
  key,
  configPart,
) => {
  const deprecatedComponents = [
    "ChildSchoolOverview",
    "PreviousSchools",
    "ChildrenOverview",
  ];

  // determine if this is part of EntityDetails for Child or for School
  if (typeof configPart === "object" && Array.isArray(configPart?.panels)) {
    const entityType = configPart?.entityType;
    const isChildDetails =
      typeof entityType === "string" && entityType.toLowerCase() === "child";

    configPart.panels.forEach((panel) => {
      panel.components?.forEach((component, index) => {
        if (
          typeof component === "object" &&
          deprecatedComponents.includes(component.component)
        ) {
          const newConfig = Object.assign(
            {},
            isChildDetails ? relatedEntitiesForChild : relatedEntitiesForSchool,
            component.config,
          ); // let existing config override defaults

          panel.components[index] = {
            component: "RelatedEntities",
            config: newConfig,
          };
          // enforce important new config properties
          component.config.entityType = "ChildSchoolRelation";
          component.config.loaderMethod = "ChildrenServiceQueryRelations";
        }
      });
    });
  }

  return configPart;
};

/**
 * Default configuration for RelatedEntities used in School entity details.
 * Displays child-related school history (childId, start/end dates, class, result).
 */
const relatedEntitiesForSchool = {
  entityType: "ChildSchoolRelation",
  columns: [
    { id: "childId" },
    { id: "start", visibleFrom: "md" },
    { id: "end", visibleFrom: "md" },
    { id: "schoolClass" },
    { id: "result" },
  ],
  loaderMethod: "ChildrenServiceQueryRelations",
};
/**
 * Default configuration for RelatedEntities used in Child entity details.
 * Displays school-related history (start/end dates, schoolId, class, result) and includes inactive records.
 */
const relatedEntitiesForChild = {
  entityType: "ChildSchoolRelation",
  columns: [
    { id: "start", visibleFrom: "md" },
    { id: "end", visibleFrom: "md" },
    { id: "schoolId" },
    { id: "schoolClass" },
    { id: "result" },
  ],
  loaderMethod: "ChildrenServiceQueryRelations",
  showInactive: true,
};

/**
 * Change editComponent "EditDescriptionOnly" to viewComponent "DisplayDescriptionOnly"
 */
const migrateEditDescriptionOnly: ConfigMigration = (key, configPart) => {
  if (configPart?.editComponent !== "EditDescriptionOnly") {
    return configPart;
  }

  configPart.viewComponent = "DisplayDescriptionOnly";
  delete configPart.editComponent;

  return configPart;
};

/**
 * Change editComponent "EditAttendance" to "EditLegacyAttendance"
 * as part of the new attendance datatype migration.
 */
const migrateEditAttendanceComponent: ConfigMigration = (key, configPart) => {
  if (configPart?.editComponent !== "EditAttendance") {
    return configPart;
  }

  configPart.editComponent = "EditLegacyAttendance";

  return configPart;
};

const migrateNotesManagerComponent: ConfigMigration = (key, configPart) => {
  if (configPart?.component !== "NotesManager") {
    return configPart;
  }

  configPart.component = "EntityList";
  if (!configPart.config) {
    configPart.config = {};
  }
  configPart.config.entityType = "Note";
  configPart.config.clickMode = "popup-details";
  delete configPart.config.includeEventNotes;
  delete configPart.config.showEventNotesToggle;

  return configPart;
};

/**
 * Migrate navigationMenu items that use a hardcoded entity route `link` to the `entityType` format.
 * Looks up each item's path against the view configs in the same config document and converts
 * only items whose view has a `config.entityType` — custom non-entity routes are left unchanged.
 * Runs at the root Config document level to have access to all view configs.
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
