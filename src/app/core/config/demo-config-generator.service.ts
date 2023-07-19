import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { Config } from "./config";
import { DatabaseRules } from "../permissions/permission-types";
import { defaultJsonConfig } from "./config-fix";

@Injectable()
export class DemoConfigGeneratorService extends DemoDataGenerator<Config> {
  static provider() {
    return [
      {
        provide: DemoConfigGeneratorService,
        useClass: DemoConfigGeneratorService,
      },
    ];
  }

  protected generateEntities(): Config<DatabaseRules>[] {
    const defaultConfig = JSON.parse(JSON.stringify(defaultJsonConfig));
    return [new Config(Config.CONFIG_KEY, defaultConfig)];
  }
}
