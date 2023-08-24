import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Config } from "./config";
import { CONFIGURABLE_ENUM_CONFIG_PREFIX } from "../basic-datatypes/configurable-enum/configurable-enum.interface";
import { LoggingService } from "../logging/logging.service";
import { ConfigurableEnum } from "../basic-datatypes/configurable-enum/configurable-enum";
import { EntityAbility } from "../permissions/ability/entity-ability";
import { LatestEntity } from "../entity/latest-entity";
import { shareReplay } from "rxjs/operators";

/**
 * Access dynamic app configuration retrieved from the database
 * that defines how the interface and data models should look.
 */
@Injectable({ providedIn: "root" })
export class ConfigService extends LatestEntity<Config> {
  /**
   * Subscribe to receive the current config and get notified whenever the config is updated.
   */
  private currentConfig: Config;

  configUpdates = this.entityUpdated.pipe(shareReplay(1));

  constructor(
    entityMapper: EntityMapperService,
    logger: LoggingService,
    private ability: EntityAbility,
  ) {
    super(Config, Config.CONFIG_KEY, entityMapper, logger);
    super.startLoading();
    this.entityUpdated.subscribe(async (config) => {
      this.currentConfig = config;
      await this.detectLegacyConfig(config);
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
    console.log("requesting", prefix, this.currentConfig);
    const matchingConfigs = [];
    for (const id of Object.keys(this.currentConfig.data)) {
      if (id.startsWith(prefix)) {
        this.currentConfig.data[id]._id = id;
        matchingConfigs.push(this.currentConfig.data[id]);
      }
    }
    return matchingConfigs;
  }

  private async detectLegacyConfig(config: Config): Promise<Config> {
    // ugly but easy ... could use https://www.npmjs.com/package/jsonpath-plus in future
    const configString = JSON.stringify(config);

    if (configString.includes("ImportantNotesComponent")) {
      this.logger.warn(
        "Legacy Config: ImportantNotesComponent found - you should use 'ImportantNotesDashboard' instead",
      );
    }

    await this.migrateEnumsToEntities(config).catch((err) =>
      this.logger.error(`ConfigurableEnum migration error: ${err}`),
    );

    return config;
  }

  private async migrateEnumsToEntities(config: Config) {
    const enumValues = Object.entries(config.data).filter(([key]) =>
      key.startsWith(CONFIGURABLE_ENUM_CONFIG_PREFIX),
    );
    if (enumValues.length === 0) {
      return;
    }
    const existingEnums = await this.entityMapper
      .loadType(ConfigurableEnum)
      .then((res) => res.map((e) => e.getId()));

    const newEnums: ConfigurableEnum[] = [];
    enumValues.forEach(([key, value]) => {
      const id = key.replace(CONFIGURABLE_ENUM_CONFIG_PREFIX, "");
      if (!existingEnums.includes(id)) {
        const newEnum = new ConfigurableEnum(id);
        newEnum.values = value as any;
        newEnums.push(newEnum);
      }
      delete config.data[key];
    });

    if (this.ability.can("create", ConfigurableEnum)) {
      await this.entityMapper.saveAll(newEnums);
    }
    if (this.ability.can("update", config)) {
      await this.entityMapper.save(config);
    }
  }
}
