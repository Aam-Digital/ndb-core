import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { Config } from "./config";
import { defaultJsonConfig } from "./config-fix";
import {
  CONFIG_SETUP_WIZARD_ID,
  defaultSetupWizardConfig,
} from "../admin/setup-wizard/setup-wizard-config";

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

  protected generateEntities(): Config[] {
    const defaultConfig = JSON.parse(JSON.stringify(defaultJsonConfig));
    return [
      new Config(Config.CONFIG_KEY, defaultConfig),
      new Config(CONFIG_SETUP_WIZARD_ID, defaultSetupWizardConfig),
    ];
  }
}
