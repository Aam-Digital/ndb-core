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
              config: { value: PLACEHOLDERS.NOW },
            },
          },
        ],
      },
    ];
    const form2 = new PublicFormConfig();
    form2.title = $localize`Another Child Registration`;
    form2.description = $localize`A second public form for Child entity for testing multiple links.`;
    form2.entity = "Child";
    form2.route = "test2";
    form2.columns = [
      {
        fields: [
          "name",
          "gender",
          "dateOfBirth",
          {
            id: "admissionDate",
            defaultValue: {
              mode: "dynamic",
              config: { value: PLACEHOLDERS.NOW },
            },
          },
        ],
      },
    ];
    const schoolForm = new PublicFormConfig();
    schoolForm.title = $localize`Example School form`;
    schoolForm.description = $localize`This is a public form for the School entity. It can be shared as a link or embedded in a website.`;
    schoolForm.entity = "School";
    schoolForm.route = "school-test";
    schoolForm.columns = [
      {
        fields: [
          "name",
          "address",
          "phone",
          "language",
          {
            id: "establishedDate",
            defaultValue: {
              mode: "dynamic",
              config: { value: PLACEHOLDERS.NOW },
            },
          },
        ],
      },
    ];

    return [form, form2, schoolForm];
  }
}
