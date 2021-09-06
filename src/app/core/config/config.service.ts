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
  /**
   * Subscribe to receive the current config and get notified whenever the config is updated.
   */
  public configUpdates: BehaviorSubject<Config>;

  private get configData(): any {
    return this.configUpdates.value.data;
  }

  constructor(@Optional() private loggingService?: LoggingService) {
    const defaultConfig = JSON.parse(JSON.stringify(defaultJsonConfig));
    this.configUpdates = new BehaviorSubject<Config>(new Config(defaultConfig));
  }

  public async loadConfig(entityMapper: EntityMapperService): Promise<Config> {
    this.configUpdates.next(await this.getConfigOrDefault(entityMapper));
    return this.configUpdates.value;
  }

  private getConfigOrDefault(
    entityMapper: EntityMapperService
  ): Promise<Config> {
    return entityMapper.load(Config, Config.CONFIG_KEY).catch(() => {
      this.loggingService.info(
        "No configuration found in the database, using default one"
      );
      const defaultConfig = JSON.parse(JSON.stringify(defaultJsonConfig));
      return new Config(defaultConfig);
    });
  }

  public async saveConfig(
    entityMapper: EntityMapperService,
    config: any
  ): Promise<Config> {
    this.configUpdates.next(new Config(config));
    await entityMapper.save<Config>(this.configUpdates.value, true);
    return this.configUpdates.value;
  }

  public async exportConfig(
    entityMapper: EntityMapperService
  ): Promise<string> {
    const config = await this.getConfigOrDefault(entityMapper);
    return JSON.stringify(config.data);
  }

  public getConfig<T>(id: string): T {
    return this.configData[id];
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
  configService.configUpdates.next(new Config(configsObject));
  return configService;
}
