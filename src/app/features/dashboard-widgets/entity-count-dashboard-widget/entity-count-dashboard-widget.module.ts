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
    ]);
  }
}
