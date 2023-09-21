import { Injectable } from "@angular/core";
import { EntityConfig } from "../../core/entity/entity-config.service";
import {
  EntityListConfig,
  GroupConfig,
} from "../../core/entity-list/EntityListConfig";
import {
  EntityDetailsConfig,
  Panel,
  PanelComponent,
} from "../../core/entity-details/EntityDetailsConfig";
import { ConfigurableEnumConfig } from "../../core/basic-datatypes/configurable-enum/configurable-enum.interface";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";
import { ConfigFieldRaw } from "./config-field.raw";
import { ViewConfig } from "../../core/config/dynamic-routing/view-config.interface";
import { defaultJsonConfig } from "../../core/config/config-fix";

@Injectable({
  providedIn: "root",
})
export class ConfigImportParserService {
  static NOT_CONFIGURED_KEY = "NOT_CONFIGURED";
  private static DEFAULT_CONFIG_KEYS = [
    "appConfig",
    "appConfig:usage-analytics",
    "navigationMenu",
    "view:",
    // TODO what do we do with these?
    "enum:interaction-type",
    "enum:warning-levels",
    "view:note",
    "view:attendance",
    "view:attendance/add-day",
    "view:attendance/recurring-activity",
    "view:attendance/recurring-activity/:id",
    "view:admin",
    "view:admin/conflicts",
    "view:admin/config-import",
    "view:import",
    "view:user",
    "view:user/:id",
    "view:help",
  ];

  enumsAvailable: Map<string, ConfigurableEnumConfig> = new Map();
  existingEnumHashmap: Map<string, string> = new Map();

  generatedViews: Map<
    string,
    ViewConfig<EntityListConfig> | ViewConfig<EntityDetailsConfig>
  > = new Map();

  private reset() {
    this.enumsAvailable.clear();
    this.existingEnumHashmap.clear();
    this.generatedViews.clear();

    // TODO: how to get the id for already existing enums in database?
  }

  parseImportDefinition(
    configRaw: ConfigFieldRaw[],
    entityName: string,
    includingDefaultConfigs: boolean,
  ): GeneratedConfig {
    this.reset();

    const entity: EntityConfig = {
      attributes: configRaw
        .filter((field) => !!field.dataType)
        .map((field) => this.parseFieldDefinition(field, entityName)),
    };

    const generatedConfig: GeneratedConfig = {};

    if (includingDefaultConfigs) {
      this.initializeDefaultValues(generatedConfig);
    }

    generatedConfig["entity:" + entityName] = entity;

    // add enum configs
    for (const [key, enumConfig] of this.enumsAvailable) {
      generatedConfig["enum:" + key] = enumConfig;
    }

    // add generated list and details view configs
    for (const [key, viewConfig] of this.generatedViews) {
      generatedConfig["view:" + key.toLowerCase()] = viewConfig;
    }

    return generatedConfig;
  }

  private parseFieldDefinition(fieldDef: ConfigFieldRaw, entityType: string) {
    const fieldId =
      fieldDef.id ??
      ConfigImportParserService.generateIdFromLabel(fieldDef.label);

    const schema: EntitySchemaField = {
      dataType: fieldDef.dataType,
      label: fieldDef.label,
      description: fieldDef.description,
    };

    if (
      fieldDef.dataType === "single-entity-select" ||
      fieldDef.dataType === "entity"
    ) {
      schema.dataType = "entity";
      schema.additional = fieldDef.additional_type_details;
    }
    if (fieldDef.dataType === "entity-array") {
      schema.dataType = "entity-array";
      schema.additional = fieldDef.additional_type_details;
    }

    if (
      fieldDef.dataType === "enum" ||
      fieldDef.dataType === "configurable-enum"
    ) {
      schema.dataType = "configurable-enum";
      schema.innerDataType = this.generateOrMatchEnum(
        fieldDef.additional_type_details,
        fieldId,
      );
    }
    if (fieldDef.dataType === "enum-multi") {
      schema.dataType = "array";
      schema.innerDataType = "configurable-enum";
      schema.additional = this.generateOrMatchEnum(
        fieldDef.additional_type_details,
        fieldId,
      );
    }

    this.generateOrUpdateListViewConfig(fieldDef, entityType, fieldId);
    this.generateOrUpdateDetailsViewConfig(fieldDef, entityType, fieldId);

    deleteEmptyProperties(schema);
    return { name: fieldId, schema: schema };
  }

  /**
   * Create a camelCase string out of any given string, so that it can be used as an id.
   * @param label The input string to be transformed
   */
  public static generateIdFromLabel(label: string) {
    return label
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s/g, "");
  }

  /**
   * Parse a comma-separated list of enum values
   * and either create a new configurable-enum config or match an existing one that has the same options.
   * @param enumValues values for enum options as imported string
   * @param key If new enum is created, this key is used as id.
   * @return The id of the matched or created configurable-enum
   * @private
   */
  private generateOrMatchEnum(enumValues: string, key: string): string {
    if (typeof enumValues !== "string") {
      return ConfigImportParserService.NOT_CONFIGURED_KEY;
    }

    let values = enumValues
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    values = values.filter((v, index) => values.indexOf(v) === index); // remove duplicates

    // identify existing enum with same values
    const hash = values.sort((a, b) => a.localeCompare(b)).join(",");
    if (this.existingEnumHashmap.has(hash)) {
      return this.existingEnumHashmap.get(hash);
    }

    // create and add new enum
    const enumConfig: ConfigurableEnumConfig = values.map((v) => ({
      id: v,
      label: v,
    }));
    this.enumsAvailable.set(key, enumConfig);
    this.existingEnumHashmap.set(hash, key);
    return key;
  }

  private generateOrUpdateListViewConfig(
    fieldDef: ConfigFieldRaw,
    entityType: string,
    fieldId: string,
  ) {
    if (
      !fieldDef.show_in_list ||
      fieldDef.show_in_list.toString().length === 0
    ) {
      return;
    }

    const listView: EntityListConfig =
      (this.generatedViews.get(entityType)?.config as EntityListConfig) ??
      this.generateEmptyListView(entityType);

    for (const fieldColGroup of fieldDef.show_in_list.split(",")) {
      const columnGroup = this.generateOrFindColumnGroup(
        listView,
        fieldColGroup.trim(),
      );
      columnGroup.columns.push(fieldId);
    }
  }

  private generateEmptyListView(entityType: string): EntityListConfig {
    const newListView = {
      columns: [],
      entity: entityType,
      title: "",
      columnGroups: { groups: [] },
    };
    this.generatedViews.set(entityType, {
      _id: entityType,
      component: "EntityList",
      config: newListView,
    });
    return newListView;
  }

  private generateOrFindColumnGroup(
    listView: EntityListConfig,
    columnGroupName: string,
  ) {
    const existingColumnGroup = listView.columnGroups.groups.find(
      (c) => c.name === columnGroupName,
    );
    if (existingColumnGroup) {
      return existingColumnGroup;
    }

    const newColumnGroup: GroupConfig = { name: columnGroupName, columns: [] };
    listView.columnGroups.groups.push(newColumnGroup);
    return newColumnGroup;
  }

  private generateOrUpdateDetailsViewConfig(
    fieldDef: ConfigFieldRaw,
    entityType: string,
    fieldId: string,
  ) {
    if (
      !fieldDef.show_in_details ||
      fieldDef.show_in_details.toString().length === 0
    ) {
      return;
    }

    const detailsView: EntityDetailsConfig =
      (this.generatedViews.get(entityType + "/:id")
        ?.config as EntityDetailsConfig) ??
      this.generateEmptyDetailsView(entityType + "/:id", entityType);

    for (const detailsTab of fieldDef.show_in_details.split(",")) {
      const [tabName, fieldGroupName] = detailsTab.split(":");
      const panel: PanelComponent = this.generateOrFindDetailsPanel(
        detailsView,
        tabName.trim(),
      );

      let fieldGroupIndex = 0;
      if (fieldGroupName) {
        if (!panel.config.headers) {
          panel.config.headers = [null]; // initialize headers with a default for fields without header
        }

        fieldGroupIndex = panel.config.headers.findIndex(
          (header) => header === fieldGroupName,
        );
        if (fieldGroupIndex === -1) {
          panel.config.headers.push(fieldGroupName);
          fieldGroupIndex = panel.config.headers.length - 1;
        }
      }

      extendArray(panel.config.cols, fieldGroupIndex + 1);
      panel.config.cols[fieldGroupIndex].push(fieldId);
    }
  }

  private generateEmptyDetailsView(
    viewId: string,
    entityType: string,
  ): EntityDetailsConfig {
    const newDetailsView = {
      entity: entityType,
      icon: "child",
      panels: [],
      title: "",
    };
    this.generatedViews.set(viewId, {
      _id: viewId,
      component: "EntityDetails",
      config: newDetailsView,
    });
    return newDetailsView;
  }

  private generateOrFindDetailsPanel(
    detailsView: EntityDetailsConfig,
    panelName: string,
  ): PanelComponent {
    const existingPanel = detailsView.panels.find(
      (c) => c.title === panelName && c.components[0].component === "Form",
    );
    if (existingPanel) {
      return existingPanel.components[0];
    }

    const newPanel: Panel = {
      title: panelName,
      components: [{ title: "", component: "Form", config: { cols: [[]] } }],
    };
    detailsView.panels.push(newPanel);
    return newPanel.components[0];
  }

  private initializeDefaultValues(generatedConfig: GeneratedConfig) {
    generatedConfig["enum:" + ConfigImportParserService.NOT_CONFIGURED_KEY] = [
      {
        id: ConfigImportParserService.NOT_CONFIGURED_KEY,
        label: "NOT CONFIGURED",
      },
    ];
    for (const key of ConfigImportParserService.DEFAULT_CONFIG_KEYS) {
      generatedConfig[key] = defaultJsonConfig[key];
    }
  }
}

export type GeneratedConfig = {
  [key: string]: EntityConfig | ViewConfig | ConfigurableEnumConfig;
};

/**
 * Delete properties on an object which are "empty", to clean up redundant details.
 */
function deleteEmptyProperties(data: Object) {
  for (const k of Object.keys(data)) {
    if (data[k] === null || data[k] === undefined) {
      delete data[k];
    }
  }
}

/**
 * Pad an array with additional empty arrays up to the given new size.
 * @param array
 * @param newSize
 */
function extendArray(array: any, newSize: number) {
  while (newSize > array.length) array.push([]);
}
