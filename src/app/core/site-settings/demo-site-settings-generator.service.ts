import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { SiteSettings } from "./site-settings";
import { MarkdownContent } from "../../features/markdown-page/markdown-content";
import { Entity } from "../entity/model/entity";

/**
 * Generates SiteSettings entity. Defaults are defined in the SiteSettings class.
 */
@Injectable()
export class DemoSiteSettingsGeneratorService extends DemoDataGenerator<Entity> {
  static provider() {
    return [
      {
        provide: DemoSiteSettingsGeneratorService,
        useClass: DemoSiteSettingsGeneratorService,
      },
    ];
  }

  protected generateEntities(): Entity[] {
    return [new SiteSettings(), this.generateHelpPage()];
  }

  private generateHelpPage(): MarkdownContent {
    const helpPage = new MarkdownContent("help");
    helpPage.content = $localize`:help-page:
# How can we help you?

Do you have a question or technical problems? Contact us:

- [support@aam-digital.app](mailto:support@aam-digital.app)

_We are happy to hear from you and help!_`;
    return helpPage;
  }
}
