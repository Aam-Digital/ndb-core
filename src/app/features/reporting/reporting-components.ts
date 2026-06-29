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
    "EditSqlQuery",
    () =>
      import("./edit-sql-query/sql-code-editor.component").then(
        (c) => c.SqlCodeEditorComponent,
      ),
  ],
  [
    "EditReportDefinition",
    () =>
      import("./edit-report-definition/edit-report-definition.component").then(
        (c) => c.EditReportDefinitionComponent,
      ),
  ],
];
