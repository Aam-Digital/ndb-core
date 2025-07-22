import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";

@NgModule({})
export class BirthdayDashboardWidgetModule {
  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "BirthdayDashboard",
        () =>
          import("./birthday-dashboard/birthday-dashboard.component").then(
            (c) => c.BirthdayDashboardComponent,
          ),
      ],
      [
        "BirthdayDashboardSettings",
        () =>
          import("./birthday-dashboard-settings.component/birthday-dashboard-settings.component").then(
            (c) => c.BirthdayDashboardSettingsComponent
          ),
      ]
    ]);
  }
}
