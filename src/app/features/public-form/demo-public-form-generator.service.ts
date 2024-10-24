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
    form.title = $localize`School forms`;
    form.description = $localize`This is a form that can be shared as a link or embedded in a website. It can be filled by users without having an account. For example you can let participants self-register their details and just review the records within Aam Digital.`;
    form.entity = "School";
    // form.prefilled = { Remarks: "newRemarksRemarks" };
    // form.columns = [["name", "address", "language", "privateSchool"]];


    // const form = new PublicFormConfig("school form");
    // form.title = $localize`Example form`;
    // form.description = $localize`This is a form that can be shared as a link or embedded in a website. It can be filled by users without having an account. For example you can let participants self-register their details and just review the records within Aam Digital.`;
    // form.entity = "School";
    // form.prefilled = { status: "new" };
    // form.columns = [["name", "address", "language", "remarks", "privateSchool"]];
    return [form];
  }
  
}
