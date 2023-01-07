import { ComponentTuple } from "../../dynamic-components";

export const progressDashboardWidgetComponents: ComponentTuple[] = [
  [
    "ProgressDashboard",
    () =>
      import("./progress-dashboard/progress-dashboard.component").then(
        (c) => c.ProgressDashboardComponent
      ),
  ],
];
