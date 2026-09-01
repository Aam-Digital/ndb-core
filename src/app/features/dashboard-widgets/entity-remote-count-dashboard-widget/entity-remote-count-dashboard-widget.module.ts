import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";
import { DashboardWidgetRegistryService } from "#src/app/core/dashboard/dashboard-widget-registry.service";

@NgModule({})
export class EntityRemoteCountDashboardWidgetModule {
  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  constructor() {
    this.widgetRegistry.register({
      component: "EntityRemoteCountDashboard",
      label: $localize`:dashboard widget name:Entity Count (calculated on the server)`,
      settingsComponent: "EntityRemoteCountDashboardSettings",
      defaultConfig: { entityType: "Note", groupBy: "category" },
    });

    const components = inject(ComponentRegistry);
    components.addAll([
      [
        "EntityRemoteCountDashboard",
        () =>
          import("./entity-remote-count-dashboard/entity-remote-count-dashboard.component").then(
            (c) => c.EntityRemoteCountDashboardComponent,
          ),
      ],
      [
        "EntityRemoteCountDashboardSettings",
        () =>
          import("./entity-remote-count-dashboard-settings.component/entity-remote-count-dashboard-settings.component").then(
            (c) => c.EntityRemoteCountDashboardSettingsComponent,
          ),
      ],
    ]);
  }
}
