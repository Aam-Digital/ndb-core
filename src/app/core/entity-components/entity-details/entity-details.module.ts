import { NgModule } from "@angular/core";
import { FormComponent } from "./form/form.component";

@NgModule({})
export class EntityDetailsModule {
  static dynamicComponents = [FormComponent];
}
