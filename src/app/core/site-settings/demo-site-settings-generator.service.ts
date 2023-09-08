import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { SiteSettings } from "./site-settings";

/**
 * Generates SiteSettings entity. Defaults are defined in the SiteSettings class.
 */
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
    return [new SiteSettings()];
  }
}
