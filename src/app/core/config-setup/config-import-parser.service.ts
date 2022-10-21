import { Injectable } from "@angular/core";
import { EntityConfig } from "../entity/entity-config.service";
import { EntityListConfig } from "../entity-components/entity-list/EntityListConfig";
import { EntityDetailsConfig } from "../entity-components/entity-details/EntityDetailsConfig";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
} from "../configurable-enum/configurable-enum.interface";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { ConfigService } from "../config/config.service";
import { ConfigFieldRaw } from "./config-field.raw";

@Injectable({
  providedIn: "root",
})
export class ConfigImportParserService {
  enumsAvailable: Map<string, ConfigurableEnumConfig> = new Map();
  existingEnumHashmap: Map<string, string> = new Map();

  constructor(private configService: ConfigService) {
    const enums = this.configService.getAllConfigs(
      CONFIGURABLE_ENUM_CONFIG_PREFIX
    );
    // TODO: how to get the id?
  }

  parseImportDefinition(
    configRaw: ConfigFieldRaw[],
    entityName: string
  ): GeneratedConfig {
    const entity: EntityConfig = {
      attributes: configRaw
        .filter((field) => !!field.dataType)
        .map((field) => this.parseFieldDefinition(field)),
    };

    const generatedConfig: GeneratedConfig = {
      ["entity:" + entityName]: entity,
    };

    // add enum configs
    for (const [key, enumConfig] of this.enumsAvailable) {
      generatedConfig["enum:" + key] = enumConfig;
    }

    //TODO generatedConfig["view:" + entityName] = {} as EntityListConfig;
    //TODO generatedConfig["view:" + entityName + "/:id"] = {} as EntityDetailsConfig;

    return generatedConfig;
  }

  private parseFieldDefinition(fieldDef: ConfigFieldRaw) {
    const key =
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
        key
      );
    }

    deleteEmptyProperties(schema);
    return { name: key, schema: schema };
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
}

export type GeneratedConfig = {
  [key: string]:
    | EntityConfig
    | EntityListConfig
    | EntityDetailsConfig
    | ConfigurableEnumConfig;
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
