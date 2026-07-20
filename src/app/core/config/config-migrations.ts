/**
 * All config migration functions, extracted from ConfigService so the CLI
 * can import them without pulling in Angular or the full app bundle.
 *
 * Node-safe: no @angular/* imports.
 * Inlined string constants: EntityDatatype.dataType = "entity",
 *   LoaderMethod.HistoricalDataService = "HistoricalDataService".
 */

import { RELATED_ENTITIES_DEFAULT_CONFIGS } from "../../utils/related-entities-default-config";
import { migrateInheritedFieldConfig } from "../../features/inherited-field/inherited-field-config-migration";
import type { DefaultValueConfig } from "../default-values/default-value-config";
import type { PanelComponent } from "../entity-details/EntityDetailsConfig";
import type { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { PLACEHOLDERS } from "../entity/schema/entity-schema-field";
import { ConfigMigration } from "./config-migration";

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

const migrateEntityArrayDatatype: ConfigMigration = (key, configPart) => {
  if (configPart === "DisplayEntityArray") {
    return "DisplayEntity";
  }

  if (!configPart?.hasOwnProperty("dataType")) {
    return configPart;
  }

  const config: EntitySchemaField = configPart;
  if (config.dataType === "entity-array") {
    config.dataType = "entity"; // inlined: EntityDatatype.dataType
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
  configPart["config"]["loaderMethod"] = "HistoricalDataService"; // inlined: LoaderMethod.HistoricalDataService

  return configPart;
};

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
  if (
    configPart?.component === "EntityCountDashboard" &&
    typeof configPart?.config?.groupBy === "string"
  ) {
    configPart.config.groupBy = [configPart.config.groupBy];
    return configPart;
  }

  return configPart;
};

type OrFilterCondition = Record<string, unknown>;
type LegacyOrFilterConfig = Record<string, unknown> & {
  $or: OrFilterCondition[];
};

const migrateLegacyIdFilters: ConfigMigration = (key, configPart) => {
  if (!configPart || typeof configPart !== "object") {
    return configPart;
  }

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

const removeOutdatedTodoViews: ConfigMigration = (key, configPart) => {
  if (
    configPart?.component === "TodoList" ||
    configPart?.component === "TodoDetails"
  ) {
    return undefined;
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

  if (Array.isArray(data?.navigationMenu?.items)) {
    data.navigationMenu.items = rewriteNavMenuLinks(
      data.navigationMenu.items,
      "/attendance/recurring-activity",
      "/recurring-activity",
    );
  }

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

const migrateChildSchoolOverviewComponent: ConfigMigration = (
  key,
  configPart,
) => {
  const deprecatedComponents = [
    "ChildSchoolOverview",
    "PreviousSchools",
    "ChildrenOverview",
  ];

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
          );

          panel.components[index] = {
            component: "RelatedEntities",
            config: newConfig,
          };
          component.config.entityType = "ChildSchoolRelation";
          component.config.loaderMethod = "ChildrenServiceQueryRelations";
        }
      });
    });
  }

  return configPart;
};

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

const migrateEditDescriptionOnly: ConfigMigration = (key, configPart) => {
  if (configPart?.editComponent !== "EditDescriptionOnly") {
    return configPart;
  }

  configPart.viewComponent = "DisplayDescriptionOnly";
  delete configPart.editComponent;

  return configPart;
};

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

const removeExportConfig: ConfigMigration = (key, configPart) => {
  if (
    configPart &&
    typeof configPart === "object" &&
    !Array.isArray(configPart) &&
    "exportConfig" in configPart
  ) {
    delete configPart.exportConfig;
  }

  return configPart;
};

/**
 * All temporary config migrations that fix legacy data formats.
 * Applied by both ConfigService (Angular app) and the admin CLI.
 * Order matters: earlier migrations may produce output consumed by later ones.
 */
export const configMigrations: ConfigMigration[] = [
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
  removeExportConfig,
];

/**
 * Apply all config migrations to a plain JSON document.
 * Returns the migrated document as a plain object (no Angular entity re-hydration).
 * Used by the admin CLI; ConfigService wraps this and also applies defaultConfigs.
 */
export function applyConfigMigrations<E>(doc: E): E {
  return JSON.parse(JSON.stringify(doc), (_that, rawValue) => {
    let docPart = rawValue;
    for (const migration of configMigrations) {
      docPart = migration(_that, docPart);
    }
    return docPart;
  });
}
