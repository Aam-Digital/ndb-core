import { Injectable, Optional } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { LoggingService } from "../logging/logging.service";
import { BehaviorSubject } from "rxjs";
import { defaultJsonConfig } from "./config-fix";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
} from "../configurable-enum/configurable-enum.interface";

/**
 * Access dynamic app configuration retrieved from the database
 * that defines how the interface and data models should look.
 */
@Injectable({
  providedIn: "root",
})
export class ConfigService {
  /**
   * Subscribe to receive the current config and get notified whenever the config is updated.
   */
  public configUpdates: BehaviorSubject<Config>;

  private get configData(): any {
    return this.configUpdates.value.data;
  }

  constructor(
    private entityMapper: EntityMapperService,
    @Optional() private loggingService?: LoggingService
  ) {
    const defaultConfig = JSON.parse(JSON.stringify(defaultJsonConfig));
    this.configUpdates = new BehaviorSubject(
      new Config(Config.CONFIG_KEY, defaultConfig)
    );
  }

  public async loadConfig(): Promise<Config> {
    this.configUpdates.next(await this.getConfigOrDefault());
    return this.configUpdates.value;
  }

  private getConfigOrDefault(): Promise<Config> {
    return this.entityMapper.load(Config, Config.CONFIG_KEY).catch(() => {
      this.loggingService.info(
        "No configuration found in the database, using default one"
      );
      const defaultConfig = JSON.parse(JSON.stringify(defaultJsonConfig));
      return new Config(Config.CONFIG_KEY, defaultConfig);
    });
  }

  public async saveConfig(config: any): Promise<Config> {
    this.configUpdates.next(new Config(Config.CONFIG_KEY, config));
    await this.entityMapper.save<Config>(this.configUpdates.value, true);
    return this.configUpdates.value;
  }

  public async exportConfig(): Promise<string> {
    const config = await this.getConfigOrDefault();
    return JSON.stringify(config.data);
  }

  public getConfig<T>(id: string): T {
    return this.configData[id];
  }

  /**
   * Get the array of pre-defined values for the given configurable enum id.
   * @param id
   */
  public getConfigurableEnumValues<T extends ConfigurableEnumValue>(
    id: string
  ): ConfigurableEnumConfig<T> {
    if (!id.startsWith(CONFIGURABLE_ENUM_CONFIG_PREFIX)) {
      id = CONFIGURABLE_ENUM_CONFIG_PREFIX + id;
    }
    return this.getConfig(id);
  }

  public getAllConfigs<T>(prefix: string): T[] {
    const matchingConfigs = [];
    for (const id of Object.keys(this.configData)) {
      if (id.startsWith(prefix)) {
        this.configData[id]._id = id;
        matchingConfigs.push(this.configData[id]);
      }
    }
    return matchingConfigs;
  }
}

export function createTestingConfigService(configsObject: any): ConfigService {
  const configService = new ConfigService(null);
  configService.configUpdates.next(
    new Config(Config.CONFIG_KEY, configsObject)
  );
  return configService;
}
