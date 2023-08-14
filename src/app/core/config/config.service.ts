import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Config } from "./config";
import { Observable, ReplaySubject } from "rxjs";
import { CONFIGURABLE_ENUM_CONFIG_PREFIX } from "../configurable-enum/configurable-enum.interface";
import { filter } from "rxjs/operators";
import { LoggingService } from "../logging/logging.service";
import { ConfigurableEnum } from "../configurable-enum/configurable-enum";
import { EntityAbility } from "../permissions/ability/entity-ability";

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

  constructor(
    private entityMapper: EntityMapperService,
    private logger: LoggingService,
    private ability: EntityAbility,
  ) {
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

  private async updateConfigIfChanged(config: Config) {
    if (!this.currentConfig || config._rev !== this.currentConfig?._rev) {
      await this.detectLegacyConfig(config);
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
