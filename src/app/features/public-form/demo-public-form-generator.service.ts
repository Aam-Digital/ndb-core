import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { PublicFormConfig } from "./public-form-config";

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
    const form = new PublicFormConfig("test");
    form.title = $localize`Example form`;
    form.description = $localize`This is a form that can be sent around or embedded in a website.`;
    form.entity = "Child";
    form.prefilled = { status: "new" };
    form.columns = [["name", "phone", "gender", "dateOfBirth", "center"]];
    return [form];
  }
}
