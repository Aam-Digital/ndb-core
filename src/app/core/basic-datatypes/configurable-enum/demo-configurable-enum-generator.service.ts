import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../demo-data/demo-data-generator";
import { ConfigurableEnum } from "./configurable-enum";
import { demoEnums } from "./configurable-enum-testing";

@Injectable()
export class DemoConfigurableEnumGeneratorService extends DemoDataGenerator<ConfigurableEnum> {
  static provider() {
    return [
      {
        provide: DemoConfigurableEnumGeneratorService,
        useClass: DemoConfigurableEnumGeneratorService,
      },
    ];
  }

  protected generateEntities(): ConfigurableEnum[] {
    return demoEnums;
  }
}
