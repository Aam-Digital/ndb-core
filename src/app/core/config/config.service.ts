import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Config } from "./config";
import { LoggingService } from "../logging/logging.service";
import { LatestEntityLoader } from "../entity/latest-entity-loader";
import { shareReplay } from "rxjs/operators";
import { FieldGroup } from "../entity-details/form/form-config";

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
      migrateFormHeadersIntoFieldGroups,
      migrateFormFieldConfigView2ViewComponent,
    ];

    const newConfig = JSON.parse(JSON.stringify(config), (_that, rawValue) => {
      let configPart = rawValue;
      for (const migration of migrations) {
        if (migration.filter(_that, configPart)) {
          configPart = migration.transform(_that, configPart);
        }
      }
      return configPart;
    });

    return newConfig;
  }
}

/**
 * A ConfigMigration is checked during a full JSON.parse using a reviver function.
 * If the filter returns true, the transform is executed on that config part.
 * Multiple migrations are chained and can transform the same config part one after the other.
 */
interface ConfigMigration {
  /** filter returning true for a given config part if transform should be executed on it */
  filter: (key: string, configPart: any) => boolean;
  transform: (key: string, configPart: any) => any;
}

/**
 * Transform legacy "view:...Form" config format to have form field group headers with the fields rather than as separate array.
 */
const migrateFormHeadersIntoFieldGroups: ConfigMigration = {
  filter: (key, configPart) =>
    configPart?.component === "Form" && configPart?.config?.cols,

  transform: (key, configPart) => {
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
  },
};

const migrateFormFieldConfigView2ViewComponent: ConfigMigration = {
  filter: (key, configPart) =>
    key === "columns" || key === "fields" || key === "cols",

  transform: (key, configPart) => {
    if (Array.isArray(configPart)) {
      return configPart.map((c) =>
        migrateFormFieldConfigView2ViewComponent.transform(null, c),
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
  },
};
