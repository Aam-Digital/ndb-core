import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Config } from "./config";
import { LoggingService } from "../logging/logging.service";
import { LatestEntityLoader } from "../entity/latest-entity-loader";
import { shareReplay } from "rxjs/operators";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";

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
      this.currentConfig = config;
    });
  }

  public saveConfig(config: any): Promise<void> {
    return this.entityMapper.save(new Config(Config.CONFIG_KEY, config), true);
  }

  public exportConfig(): string {
    return JSON.stringify(this.currentConfig.data);
  }

  public getConfig<T>(id: string): T {
    return this.applyMigrations(id, this.currentConfig.data[id]);
  }

  public getAllConfigs<T>(prefix: string): T[] {
    const matchingConfigs = [];
    for (const id of Object.keys(this.currentConfig.data)) {
      if (id.startsWith(prefix)) {
        this.currentConfig.data[id]._id = id;
        matchingConfigs.push(this.currentConfig.data[id]);
      }
    }
    return matchingConfigs.map((c) => this.applyMigrations(prefix, c));
  }

  private applyMigrations(id: string, configData: any) {
    configData = migrateEntityAttributesWithId(id, configData);
    return configData;
  }
}

/**
 * Transform legacy "entity:" config format into the flattened structure containing id directly.
 */
function migrateEntityAttributesWithId(idOrPrefix: string, configData: any) {
  if (!idOrPrefix.startsWith("entity")) {
    return configData;
  }

  configData.attributes = configData.attributes?.map(
    (attr): EntitySchemaField => {
      if (attr.schema) {
        const legacyAttr: { name: string; schema: EntitySchemaField } = attr;
        return {
          id: legacyAttr.name,
          ...attr.schema,
        };
      }
      return attr;
    },
  );

  return configData;
}
