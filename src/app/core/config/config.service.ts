import { Injectable, Optional } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { LoggingService } from "../logging/logging.service";
import { BehaviorSubject } from "rxjs";
import { defaultJsonConfig } from "./config-fix";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  private static CONFIG_KEY = "CONFIG_ENTITY";
  private config: Config = new Config(ConfigService.CONFIG_KEY);

  /**
   * Subscribe to receive the current config and get notified whenever the config is updated.
   */
  public configUpdated: BehaviorSubject<Config>;

  constructor(@Optional() private loggingService?: LoggingService) {
    this.config.data = JSON.parse(JSON.stringify(defaultJsonConfig));
    this.configUpdated = new BehaviorSubject<Config>(this.config);
  }

  public async loadConfig(entityMapper: EntityMapperService): Promise<Config> {
    this.config = await this.getConfigOrDefault(entityMapper);
    this.configUpdated.next(this.config);
    return this.config;
  }

  private getConfigOrDefault(
    entityMapper: EntityMapperService
  ): Promise<Config> {
    return entityMapper.load(Config, ConfigService.CONFIG_KEY).catch(() => {
      this.loggingService.info(
        "No configuration found in the database, using default one"
      );
      const defaultConfig = new Config(ConfigService.CONFIG_KEY);
      defaultConfig.data = JSON.parse(JSON.stringify(defaultJsonConfig));
      return defaultConfig;
    });
  }

  public async saveConfig(
    entityMapper: EntityMapperService,
    config: any
  ): Promise<Config> {
    this.config.data = config;
    this.configUpdated.next(this.config);
    await entityMapper.save<Config>(this.config);
    return this.config;
  }

  public async exportConfig(
    entityMapper: EntityMapperService
  ): Promise<string> {
    const config = await this.getConfigOrDefault(entityMapper);
    return JSON.stringify(config.data);
  }

  public getConfig<T>(id: string): T {
    return this.config.data[id];
  }

  public getAllConfigs<T>(prefix: string): T[] {
    const matchingConfigs = [];
    for (const id of Object.keys(this.config.data)) {
      if (id.startsWith(prefix)) {
        this.config.data[id]._id = id;
        matchingConfigs.push(this.config.data[id]);
      }
    }
    return matchingConfigs;
  }
}

export function createTestingConfigService(configsObject: any): ConfigService {
  const configService = new ConfigService(null);
  // @ts-ignore
  configService.config.data = configsObject;
  return configService;
}
