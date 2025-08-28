import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";

/**
 * A dashboard view displaying various widgets with latest overviews and analysis to users.
 */
@NgModule()
export class DashboardModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll([
      [
        "AdminDashboard",
        () =>
          import("../dashboard/admin-dashboard/admin-dashboard.component").then(
            (c) => c.AdminDashboardComponent,
          ),
      ],
    ]);
  }
}
