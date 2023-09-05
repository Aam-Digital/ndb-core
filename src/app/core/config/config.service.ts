import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Config } from "./config";
import { Observable, ReplaySubject } from "rxjs";
import { filter } from "rxjs/operators";

/**
 * Access dynamic app configuration retrieved from the database
 * that defines how the interface and data models should look.
 */
@Injectable({ providedIn: "root" })
export class ConfigService {
  /**
   * Subscribe to receive the current config and get notified whenever the config is updated.
   */
  private _configUpdates = new ReplaySubject<Config>(1);
  private currentConfig: Config;

  get configUpdates(): Observable<Config> {
    return this._configUpdates.asObservable();
  }

  constructor(private entityMapper: EntityMapperService) {
    this.loadConfig();
    this.entityMapper
      .receiveUpdates(Config)
      .pipe(filter(({ entity }) => entity.getId() === Config.CONFIG_KEY))
      .subscribe(({ entity }) => this.updateConfigIfChanged(entity));
  }

  async loadConfig(): Promise<void> {
    return this.entityMapper
      .load(Config, Config.CONFIG_KEY)
      .then((config) => this.updateConfigIfChanged(config))
      .catch(() => {});
  }

  private updateConfigIfChanged(config: Config) {
    if (!this.currentConfig || config._rev !== this.currentConfig?._rev) {
      this.currentConfig = config;
      this._configUpdates.next(config);
    }
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
}
