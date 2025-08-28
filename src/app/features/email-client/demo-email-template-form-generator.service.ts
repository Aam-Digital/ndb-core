import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { EmailTemplate } from "./email-template.entity";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types";

@Injectable()
export class DemoEmailTemplateFormGeneratorService extends DemoDataGenerator<EmailTemplate> {
  static provider() {
    return [
      {
        provide: DemoEmailTemplateFormGeneratorService,
        useClass: DemoEmailTemplateFormGeneratorService,
      },
    ];
  }

  protected generateEntities(): EmailTemplate[] {
    const form = new EmailTemplate();
    form.subject = $localize`Happy Birthday!`;
    form.body = $localize`Wishing you a wonderful birthday filled with joy and happiness. Have a fantastic year ahead!`;
    form.category = defaultInteractionTypes[3];

    return [form];
  }
}
