import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { NEVER, Observable, ReplaySubject, Subject } from "rxjs";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
  ConfigurableEnumValue,
} from "../configurable-enum/configurable-enum.interface";
import { filter, map } from "rxjs/operators";
import { mockEntityMapper } from "../entity/mock-entity-mapper-service";
import { SessionService } from "../session/session-service/session.service";

/**
 * Access dynamic app configuration retrieved from the database
 * that defines how the interface and data models should look.
 */
@Injectable()
export class ConfigService {
  /**
   * Subscribe to receive the current config and get notified whenever the config is updated.
   */
  private _configUpdates = new ReplaySubject<Config>(1);
  private currentConfig: Config;

  get configUpdates(): Observable<Config> {
    return this._configUpdates.asObservable();
  }

  constructor(
    private entityMapper: EntityMapperService,
    private sessionService: SessionService
  ) {
    this.sessionService.loginState.subscribe(() => this.loadConfig());
    this.entityMapper
      .receiveUpdates(Config)
      .pipe(
        map(({ entity }) => entity),
        filter((entity) => entity.getId() === Config.CONFIG_KEY)
      )
      .subscribe((config) => this.updateConfigIfChanged(config));
  }

  private async loadConfig(): Promise<void> {
    this.entityMapper
      .load(Config, Config.CONFIG_KEY)
      .then((config) => this.updateConfigIfChanged(config))
      .catch(() => {});
  }

  private updateConfigIfChanged(config: Config) {
    if (config._rev !== this.currentConfig?._rev) {
      this.currentConfig = config;
      this._configUpdates.next(config);
      console.log("udpated config");
    }
  }

  public saveConfig(config: any): Promise<void> {
    return this.entityMapper.save(config, true);
  }

  public exportConfig(): string {
    return JSON.stringify(this.currentConfig);
  }

  public getConfig<T>(id: string): T {
    return this.currentConfig.data[id];
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
    for (const id of Object.keys(this.currentConfig.data)) {
      if (id.startsWith(prefix)) {
        this.currentConfig.data[id]._id = id;
        matchingConfigs.push(this.currentConfig.data[id]);
      }
    }
    return matchingConfigs;
  }
}

export function createTestingConfigService(configsObject: any): ConfigService {
  return new ConfigService(
    mockEntityMapper([new Config(Config.CONFIG_KEY, configsObject)]),
    { loginState: NEVER } as any
  );
}
