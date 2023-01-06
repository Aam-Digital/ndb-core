import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { schoolsComponents } from "./schools-components";

@NgModule({})
export class SchoolsModule {
  constructor(components: ComponentRegistry) {
    components.addAll(schoolsComponents);
  }
}
