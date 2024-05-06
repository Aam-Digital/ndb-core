import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Config } from "./config";
import { LoggingService } from "../logging/logging.service";
import { LatestEntityLoader } from "../entity/latest-entity-loader";
import { shareReplay } from "rxjs/operators";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { FieldGroup } from "../entity-details/form/field-group";
import { MenuItem } from "../ui/navigation/menu-item";
import { EntityDatatype } from "../basic-datatypes/entity/entity.datatype";

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

  constructor(entityMapper: EntityMapperService, logger: LoggingService) {
    super(Config, Config.CONFIG_KEY, entityMapper, logger);
    super.startLoading();
    this.entityUpdated.subscribe(async (config) => {
      this.currentConfig = this.applyMigrations(config);
    });
  }

  public saveConfig(config: any): Promise<void> {
    return this.entityMapper.save(new Config(Config.CONFIG_KEY, config), true);
  }

  public exportConfig(): string {
    return JSON.stringify(this.currentConfig.data);
  }

  public getConfig<T>(id: string): T {
    return this.currentConfig.data[id];
  }

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

  private applyMigrations(config: Config): Config {
    const migrations: ConfigMigration[] = [
      migrateEntityAttributesWithId,
      migrateFormHeadersIntoFieldGroups,
      migrateFormFieldConfigView2ViewComponent,
      migrateMenuItemConfig,
      migrateEntityDetailsInputEntityType,
      migrateEntityArrayDatatype,
    ];

    const newConfig = JSON.parse(JSON.stringify(config), (_that, rawValue) => {
      let configPart = rawValue;
      for (const migration of migrations) {
        configPart = migration(_that, configPart);
      }
      return configPart;
    });

    return newConfig;
  }
}

/**
 * A ConfigMigration is checked during a full JSON.parse using a reviver function.
 * If the migration does not apply to the given configPart, make sure to return it unchanged.
 * Multiple migrations are chained and can transform the same config part one after the other.
 */
type ConfigMigration = (key: string, configPart: any) => any;

/**
 * Transform legacy "entity:" config format into the flattened structure containing id directly.
 */
const migrateEntityAttributesWithId: ConfigMigration = (key, configPart) => {
  if (!(key.startsWith("entity") && Array.isArray(configPart.attributes))) {
    return configPart;
  }

  configPart.attributes = configPart.attributes.reduce(
    (acc, attr: { name: string; schema: EntitySchemaField }) => ({
      ...acc,
      [attr.name]: attr.schema,
      // id inside the field schema config (FieldConfig) is added by EntityConfigService and does not need migration
    }),
    {},
  );

  return configPart;
};

/**
 * Transform legacy "view:...Form" config format to have form field group headers with the fields rather than as separate array.
 */
const migrateFormHeadersIntoFieldGroups: ConfigMigration = (
  key,
  configPart,
) => {
  if (!(configPart?.component === "Form" && configPart?.config?.cols)) {
    return configPart;
  }

  const formConfig = configPart.config;

  // change .cols and .headers into .fieldGroups
  const newFormConfig = { ...formConfig };
  delete newFormConfig.cols;
  delete newFormConfig.headers;

  newFormConfig.fieldGroups = formConfig.cols?.map(
    (colGroup) => ({ fields: colGroup }) as FieldGroup,
  );
  if (formConfig.headers) {
    newFormConfig.fieldGroups.forEach((group, i) => {
      if (formConfig.headers[i]) {
        group.header = formConfig.headers[i];
      }
    });
  }

  configPart.config = newFormConfig;
  return configPart;
};

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

const migrateMenuItemConfig: ConfigMigration = (key, configPart) => {
  if (key !== "navigationMenu") {
    return configPart;
  }

  const oldItems: (
    | {
        name: string;
        icon: string;
        link: string;
      }
    | MenuItem
  )[] = configPart.items;

  configPart.items = oldItems.map((item) => {
    if (item.hasOwnProperty("name")) {
      return {
        label: item["name"],
        icon: item.icon,
        link: item.link,
      };
    } else {
      return item;
    }
  });

  return configPart;
};

/**
 * Config properties specifying an entityType should be name "entityType" rather than "entity"
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
