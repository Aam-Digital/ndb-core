import { Injectable } from "@angular/core";
import * as defaultConfig from "./config-fix.json";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  private static CONFIG_KEY = "CONFIG_ENTITY";
  private config: Config = new Config(ConfigService.CONFIG_KEY);

  constructor() {
    this.config.data = defaultConfig;
  }

  public async loadConfig(entityMapper: EntityMapperService) {
    const resultConfig = await entityMapper.load<Config>(
      Config,
      ConfigService.CONFIG_KEY
    );
    if (resultConfig) {
      this.config = resultConfig;
    }
  }

  public saveConfig(
    entityMapper: EntityMapperService,
    config: any
  ): Promise<Config> {
    this.config.data = config;
    return entityMapper.save<Config>(this.config);
  }

  public exportConfig(): string {
    return JSON.stringify(this.config.data);
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
