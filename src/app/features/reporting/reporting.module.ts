import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { reportingComponents } from "./reporting-components";

@NgModule({})
export class ReportingModule {
  constructor(components: ComponentRegistry) {
    components.addAll(reportingComponents);
  }
}
