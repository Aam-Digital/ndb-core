import { ComponentTuple } from "../../dynamic-components";

export const reportingComponents: ComponentTuple[] = [
  [
    "Reporting",
    () =>
      import("./reporting/reporting.component").then(
        (c) => c.ReportingComponent,
      ),
  ],
  [
    "EditReportMode",
    () =>
      import("./edit-report-mode/edit-report-mode.component").then(
        (c) => c.EditReportModeComponent,
      ),
  ],
  [
    "EditReportPeriodToggle",
    () =>
      import("./edit-report-period-toggle/edit-report-period-toggle.component").then(
        (c) => c.EditReportPeriodToggleComponent,
      ),
  ],
  [
    "EditReportFieldByMode",
    () =>
      import("./edit-report-field-by-mode/edit-report-field-by-mode.component").then(
        (c) => c.EditReportFieldByModeComponent,
      ),
  ],
];
