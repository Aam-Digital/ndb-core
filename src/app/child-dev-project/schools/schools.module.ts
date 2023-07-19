import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { schoolsComponents } from "./schools-components";
import { School } from "./model/school";

@NgModule({})
export class SchoolsModule {
  static databaseEntities = [School];

  constructor(components: ComponentRegistry) {
    components.addAll(schoolsComponents);
  }
}
