import { Injectable } from "@angular/core";
import { EntityConfig } from "../entity/entity-config.service";
import {
  EntityListConfig,
  GroupConfig,
} from "../entity-components/entity-list/EntityListConfig";
import {
  EntityDetailsConfig,
  Panel,
  PanelComponent,
} from "../entity-components/entity-details/EntityDetailsConfig";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
} from "../configurable-enum/configurable-enum.interface";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { ConfigService } from "../config/config.service";
import { ConfigFieldRaw } from "./config-field.raw";
import { ViewConfig } from "../view/dynamic-routing/view-config.interface";
import { defaultJsonConfig } from "../config/config-fix";

@Injectable({
  providedIn: "root",
})
export class ConfigImportParserService {
  enumsAvailable: Map<string, ConfigurableEnumConfig> = new Map();
  existingEnumHashmap: Map<string, string> = new Map();

  generatedViews: Map<
    string,
    ViewConfig<EntityListConfig> | ViewConfig<EntityDetailsConfig>
  > = new Map();

  constructor(private configService: ConfigService) {}

  private reset() {
    this.enumsAvailable.clear();
    this.existingEnumHashmap.clear();
    this.generatedViews.clear();

    const enums = this.configService.getAllConfigs(
      CONFIGURABLE_ENUM_CONFIG_PREFIX
    );
    // TODO: how to get the id for already existing enums in database?
  }

  parseImportDefinition(
    configRaw: ConfigFieldRaw[],
    entityName: string
  ): GeneratedConfig {
    this.reset();

    const entity: EntityConfig = {
      attributes: configRaw
        .filter((field) => !!field.dataType)
        .map((field) => this.parseFieldDefinition(field, entityName)),
    };

    const generatedConfig: GeneratedConfig = {};

    generatedConfig["entity:" + entityName] = entity;

    // add enum configs
    for (const [key, enumConfig] of this.enumsAvailable) {
      generatedConfig["enum:" + key] = enumConfig;
    }

    // add generated list and details view configs
    for (const [key, viewConfig] of this.generatedViews) {
      generatedConfig["view:" + key.toLowerCase()] = viewConfig;
    }

    // add some default configs
    for (const [key, config] of this.generateDefaultConfigs(entityName)) {
      generatedConfig[key] = config;
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
      fieldDef.dataType === "enum" ||
      fieldDef.dataType === "configurable-enum"
    ) {
      schema.dataType = "configurable-enum";
      schema.innerDataType = this.generateOrMatchEnum(
        fieldDef.additional_type_details,
        fieldId
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
      return "???";
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
    fieldId: string
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
        fieldColGroup.trim()
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
    columnGroupName: string
  ) {
    const existingColumnGroup = listView.columnGroups.groups.find(
      (c) => c.name === columnGroupName
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
    fieldId: string
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

    if (fieldDef.show_in_details) {
      const panel: PanelComponent = this.generateOrFindDetailsPanel(
        detailsView,
        fieldDef.show_in_details.trim()
      );
      panel.config.cols[0].push(fieldId);
    }
  }

  private generateEmptyDetailsView(
    viewId: string,
    entityType: string
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
    panelName: string
  ): PanelComponent {
    const existingPanel = detailsView.panels.find(
      (c) => c.title === panelName && c.components[0].component === "Form"
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

  private generateDefaultConfigs(entityName: string) {
    const configs = new Map<string, any>();

    configs.set("appConfig", defaultJsonConfig.appConfig);
    configs.set(
      "appConfig:usage-analytics",
      defaultJsonConfig["appConfig:usage-analytics"]
    );
    configs.set("navigationMenu", defaultJsonConfig.navigationMenu);
    configs.set("view:", defaultJsonConfig["view:"]);
    configs.set(
      "enum:interaction-type",
      defaultJsonConfig["enum:interaction-type"]
    );
    configs.set(
      "enum:warning-levels",
      defaultJsonConfig["enum:warning-levels"]
    );
    configs.set("view:note", defaultJsonConfig["view:note"]);
    configs.set("view:admin", defaultJsonConfig["view:admin"]);
    configs.set(
      "view:admin/conflicts",
      defaultJsonConfig["view:admin/conflicts"]
    );
    configs.set(
      "view:admin/config-import",
      defaultJsonConfig["view:admin/config-import"]
    );
    configs.set("view:import", defaultJsonConfig["view:import"]);
    configs.set("view:user", defaultJsonConfig["view:user"]);
    configs.set("view:user/:id", defaultJsonConfig["view:user/:id"]);
    configs.set("view:help", defaultJsonConfig["view:help"]);

    return configs;
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
