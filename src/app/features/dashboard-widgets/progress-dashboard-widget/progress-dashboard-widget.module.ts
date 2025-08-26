import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";
import { ProgressDashboardConfig } from "./progress-dashboard/progress-dashboard-config";
import { DashboardWidgetRegistryService } from "../../../core/dashboard/dashboard-widget-registry.service";

@NgModule({})
export class ProgressDashboardWidgetModule {
  static databaseEntities = [ProgressDashboardConfig];

  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  constructor() {
    this.widgetRegistry.register("ProgressDashboard", "ProgressDashboardSettings");

    const components = inject(ComponentRegistry);

    components.addAll([
      [
        "ProgressDashboard",
        () =>
          import("./progress-dashboard/progress-dashboard.component").then(
            (c) => c.ProgressDashboardComponent,
          ),
      ],
      [
        "ProgressDashboardSettings",
        () =>
          import(
            "./progress-dashboard-settings/progress-dashboard-settings.component"
          ).then((c) => c.ProgressDashboardSettingsComponent),
      ],
    ]);
  }
}
