import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";
import { DashboardWidgetRegistryService } from "#src/app/core/dashboard/dashboard-widget-registry.service";

@NgModule({})
export class EntityCountDashboardWidgetModule {
  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  constructor() {
    this.widgetRegistry.register({
      component: "EntityCountDashboard",
      label: $localize`Entity Count`,
      settingsComponent: "EntityCountDashboardSettings",
      defaultConfig: {},
    });

    const components = inject(ComponentRegistry);
    components.addAll([
      [
        "EntityCountDashboard",
        () =>
          import("./entity-count-dashboard/entity-count-dashboard.component").then(
            (c) => c.EntityCountDashboardComponent,
          ),
      ],
      [
        "ChildrenCountDashboard",
        () =>
          import("./entity-count-dashboard/entity-count-dashboard.component").then(
            (c) => c.EntityCountDashboardComponent,
          ),
      ],
      [
        "EntityCountDashboardSettings",
        () =>
          import("./entity-count-dashboard-settings.component/entity-count-dashboard-settings.component").then(
            (c) => c.EntityCountDashboardSettingsComponent,
          ),
      ],
    ]);
  }
}
