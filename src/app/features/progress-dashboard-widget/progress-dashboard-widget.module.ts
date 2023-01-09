import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { progressDashboardWidgetComponents } from "./progress-dashboard-widget-components";

@NgModule({})
export class ProgressDashboardWidgetModule {
  constructor(components: ComponentRegistry) {
    components.addAll(progressDashboardWidgetComponents);
  }
}
