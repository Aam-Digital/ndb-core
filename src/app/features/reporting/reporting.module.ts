import { inject, NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { reportingComponents } from "./reporting-components";
import { ReportEntity } from "./report-config";

@NgModule({})
export class ReportingModule {
  static readonly databaseEntities = [ReportEntity];

  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(reportingComponents);
  }
}
