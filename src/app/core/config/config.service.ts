import { Injectable } from "@angular/core";
import { RELATED_ENTITIES_DEFAULT_CONFIGS } from "app/utils/related-entities-default-config";
import { shareReplay } from "rxjs/operators";
import { addDefaultRecurringActivityDetailsConfig } from "../../child-dev-project/attendance/add-default-recurring-activity-views";
import { addDefaultNoteDetailsConfig } from "../../child-dev-project/notes/add-default-note-views";
import { addDefaultTodoViews } from "../../features/todos/add-default-todo-views";
import { migrateInheritedFieldConfig } from "../../features/inherited-field/inherited-field-config-migration";
import { addDefaultImportViewConfig } from "../import/add-default-import-view";
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
      this.currentConfig = this.applyMigrations(config);
      this.logConfigRev();
    });

    this.startLoading();
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
    const value = JSON.stringify(this.currentConfig.data);
    return rawObject ? JSON.parse(value) : value;
  }

  public getConfig<T>(id: string): T | undefined {
    return this.currentConfig.data[id];
  }

  /**
   * Return all config items of the given "type"
   * (determined by the given prefix of their id).
   *
   * @param prefix The prefix of config items to return (e.g. "view:" or "entity:")
   */
  public getAllConfigs<T>(prefix: string): T[] {
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
      migrateDefaultValue,
      migrateInheritedFieldConfig,
      migrateUserEntityAndPanels,
      migrateComponentEntityTypeDefaults,
      migrateActivitiesOverviewComponent,
      removeOutdatedTodoViews,
      migrateChildSchoolOverviewComponent,
      migrateEditDescriptionOnly,
    ];

    // default migrations that are not only temporary but will remain in the codebase
    const defaultConfigs: ConfigMigration[] = [
      addDefaultNoteDetailsConfig,
      addDefaultTodoViews,
      addDefaultRecurringActivityDetailsConfig,
      addDefaultImportViewConfig,
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

/**
 * Migration to replace the deprecated `ActivitiesOverview` component
 * with the more flexible `RelatedEntities` component configured for `RecurringActivity`.
 * - If a config exists, only the component string is replaced to preserve the system-specific config.
 * - If no config is defined, a default config is added with common columns like:
 * This ensures consistency while maintaining any existing customizations.
 */
const migrateActivitiesOverviewComponent: ConfigMigration = (
  _key,
  configPart,
) => {
  if (
    typeof configPart !== "object" ||
    configPart?.component !== "ActivitiesOverview"
  ) {
    return configPart;
  }

  const existingConfig =
    configPart.config && Object.keys(configPart.config).length > 0;

  if (existingConfig) {
    configPart.entityType = "RecurringActivity";
    return {
      ...configPart,
      component: "RelatedEntities",
    };
  }

  return {
    component: "RelatedEntities",
    config: {
      entityType: "RecurringActivity",
      columns: [
        {
          id: "title",
          editComponent: "EditTextWithAutocomplete",
          additional: {
            entityType: "RecurringActivity",
            relevantProperty: "linkedGroups",
          },
        },
        { id: "assignedTo" },
        { id: "linkedGroups" },
        { id: "excludedParticipants" },
      ],
    },
  };
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
