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
    for (let [key, conf] of Object.entries(config.data)) {
      // LIST ALL MIGRATION FUNCTIONS HERE
      conf = migrateFormHeadersIntoFieldGroups(key, conf);

      config.data[key] = conf;
    }
    return config;
  }
}

/**
 * Transform legacy "view:...Form" config format to have form field group headers with the fields rather than as separate array.
 */
function migrateFormHeadersIntoFieldGroups(
  idOrPrefix: string,
  configData: any,
) {
  if (!idOrPrefix.startsWith("view") || !configData) {
    return configData;
  }

  const configString = JSON.stringify(configData);
  if (!configString.includes('"component":"Form"')) {
    return configData;
  }

  function migrateFormConfig(formConfig) {
    if (!formConfig?.cols) {
      return formConfig;
    }

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

    return newFormConfig;
  }

  const newConfig = JSON.parse(configString, (_that, rawValue) => {
    if (rawValue?.component !== "Form") {
      // do not transform unless config for `{ component: "Form", config: { ... } }` parts
      return rawValue;
    }

    rawValue.config = migrateFormConfig(rawValue.config);
    return rawValue;
  });

  return newConfig;
}
