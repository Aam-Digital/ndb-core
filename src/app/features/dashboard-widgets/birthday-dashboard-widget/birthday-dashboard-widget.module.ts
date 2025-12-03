import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";
import { DashboardWidgetRegistryService } from "../../../core/dashboard/dashboard-widget-registry.service";

@NgModule({})
export class BirthdayDashboardWidgetModule {
  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  constructor() {
    this.widgetRegistry.register({
      component: "BirthdayDashboard",
      label: $localize`Birthdays`,
      settingsComponent: "BirthdayDashboardSettings",
      defaultConfig: {
        entities: { Child: "dateOfBirth", School: "dateOfBirth" },
      },
    });

    const components = inject(ComponentRegistry);

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
            (c) => c.BirthdayDashboardSettingsComponent,
          ),
      ],
    ]);
  }
}
