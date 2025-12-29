import { inject, NgModule } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";
import { DashboardWidgetRegistryService } from "#src/app/core/dashboard/dashboard-widget-registry.service";

@NgModule({})
export class ShortcutDashboardWidgetModule {
  private readonly widgetRegistry = inject(DashboardWidgetRegistryService);

  constructor() {
    this.widgetRegistry.register({
      component: "ShortcutDashboard",
      label: $localize`Shortcuts`,
      settingsComponent: "ShortcutDashboardSettings",
      defaultConfig: {
        shortcuts: [],
      },
    });

    const components = inject(ComponentRegistry);

    components.addAll([
      [
        "ShortcutDashboard",
        () =>
          import("./shortcut-dashboard/shortcut-dashboard.component").then(
            (c) => c.ShortcutDashboardComponent,
          ),
      ],
      [
        "DashboardShortcutWidget", // @deprecated for backwards-compatibility only
        () =>
          import("./shortcut-dashboard/shortcut-dashboard.component").then(
            (c) => c.ShortcutDashboardComponent,
          ),
      ],
      [
        "ShortcutDashboardSettings",
        () =>
          import("./shortcut-dashboard-settings.component/shortcut-dashboard-settings.component").then(
            (c) => c.ShortcutDashboardSettingsComponent,
          ),
      ],
    ]);
  }
}
