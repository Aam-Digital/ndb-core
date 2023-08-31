import { ComponentTuple } from "../../dynamic-components";

export const reportingComponents: ComponentTuple[] = [
  [
    "Reporting",
    () =>
      import("./reporting/reporting.component").then(
        (c) => c.ReportingComponent,
      ),
  ],
];
