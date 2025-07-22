import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";

@NgModule({})
export class EntityCountDashboardWidgetModule {
  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "EntityCountDashboard",
        () =>
          import(
            "./entity-count-dashboard/entity-count-dashboard.component"
          ).then((c) => c.EntityCountDashboardComponent),
      ],
      [
        "ChildrenCountDashboard",
        () =>
          import(
            "./entity-count-dashboard/entity-count-dashboard.component"
          ).then((c) => c.EntityCountDashboardComponent),
      ],
      [
        "EntityCountDashboardSettings",
        () =>
          import(
            "./entity-count-dashboard-settings.component/entity-count-dashboard-settings.component"
          ).then((c) => c.EntityCountDashboardSettingsComponent),
      ],
    ]);
  }
}
