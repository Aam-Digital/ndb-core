import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";

@NgModule({})
export class ShortcutDashboardWidgetModule {
  constructor() {
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
