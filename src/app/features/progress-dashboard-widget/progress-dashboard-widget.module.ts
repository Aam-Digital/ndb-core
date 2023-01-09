import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { progressDashboardWidgetComponents } from "./progress-dashboard-widget-components";
import { ProgressDashboardConfig } from "./progress-dashboard/progress-dashboard-config";

@NgModule({})
export class ProgressDashboardWidgetModule {
  static databaseEntities = [ProgressDashboardConfig];

  constructor(components: ComponentRegistry) {
    components.addAll(progressDashboardWidgetComponents);
  }
}
