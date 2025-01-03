import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { PublicFormConfig } from "./public-form-config";
import { PLACEHOLDERS } from "../../core/entity/schema/entity-schema-field";

@Injectable()
export class DemoPublicFormGeneratorService extends DemoDataGenerator<PublicFormConfig> {
  static provider() {
    return [
      {
        provide: DemoPublicFormGeneratorService,
        useClass: DemoPublicFormGeneratorService,
      },
    ];
  }

  protected generateEntities(): PublicFormConfig[] {
    const form = new PublicFormConfig();
    form.title = $localize`Example form`;
    form.description = $localize`This is a form that can be shared as a link or embedded in a website. It can be filled by users without having an account. For example you can let participants self-register their details and just review the records within Aam Digital.`;
    form.entity = "Child";
    form.route = "test";
    form.columns = [
      {
        fields: [
          "name",
          "phone",
          "gender",
          "dateOfBirth",
          "center",
          {
            id: "admissionDate",
            defaultValue: {
              mode: "dynamic",
              value: PLACEHOLDERS.NOW,
            },
          },
        ],
      },
    ];
    return [form];
  }
}
