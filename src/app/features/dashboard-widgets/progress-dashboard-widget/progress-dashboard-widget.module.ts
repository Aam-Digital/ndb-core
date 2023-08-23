import {NgModule} from "@angular/core";
import {ComponentRegistry} from "../../../dynamic-components";
import {ProgressDashboardConfig} from "./progress-dashboard/progress-dashboard-config";

@NgModule({})
export class ProgressDashboardWidgetModule {
  static databaseEntities = [ProgressDashboardConfig];

  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "ProgressDashboard",
        () =>
          import("./progress-dashboard/progress-dashboard.component").then(
            (c) => c.ProgressDashboardComponent,
          ),
      ],
    ]);
  }
}
