import { Injectable, Optional } from "@angular/core";
import defaultConfig from "./config-fix.json";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { LoggingService } from "../logging/logging.service";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  private static CONFIG_KEY = "CONFIG_ENTITY";
  private config: Config = new Config(ConfigService.CONFIG_KEY);
  private subscribers: Array<() => any> = [];

  constructor(@Optional() private loggingService: LoggingService) {
    this.config.data = defaultConfig;
  }

  public async loadConfig(entityMapper: EntityMapperService): Promise<Config> {
    try {
      this.config = await entityMapper.load<Config>(
        Config,
        ConfigService.CONFIG_KEY
      );
    } catch (e) {
      this.loggingService.info(
        "No configuration found in the database, using default one"
      );
      //  no config found in db, using default one
    }
    this.subscribers.forEach((f) => f());
    return this.config;
  }

  public subscribeConfig(fun: () => any) {
    this.subscribers.push(fun);
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
    console.log("prefix", prefix);
    console.log("config", this.config);

    for (const id of Object.keys(this.config.data)) {
      if (id.startsWith(prefix)) {
        this.config.data[id]._id = id;
        matchingConfigs.push(this.config.data[id]);
      }
    }

    return matchingConfigs;
  }
}
