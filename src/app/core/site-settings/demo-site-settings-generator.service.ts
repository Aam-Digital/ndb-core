import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { SiteSettings } from "./site-settings";

@Injectable()
export class DemoSiteSettingsGeneratorService extends DemoDataGenerator<SiteSettings> {
  static provider() {
    return [
      {
        provide: DemoSiteSettingsGeneratorService,
        useClass: DemoSiteSettingsGeneratorService,
      },
    ];
  }

  protected generateEntities(): SiteSettings[] {
    console.log("Generating demo data");
    return [new SiteSettings()];
  }
}
