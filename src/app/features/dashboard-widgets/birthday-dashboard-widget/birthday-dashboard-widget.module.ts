import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";

@NgModule({})
export class BirthdayDashboardWidgetModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll([
      [
        "BirthdayDashboard",
        () =>
          import("./birthday-dashboard/birthday-dashboard.component").then(
            (c) => c.BirthdayDashboardComponent,
          ),
      ],
    ]);
  }
}
