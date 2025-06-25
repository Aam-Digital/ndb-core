import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { reportingComponents } from "./reporting-components";

@NgModule({})
export class ReportingModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(reportingComponents);
  }
}
