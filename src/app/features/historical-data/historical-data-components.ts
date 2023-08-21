import { ComponentTuple } from "../../dynamic-components";

export const historicalDataComponents: ComponentTuple[] = [
  [
    "HistoricalDataComponent",
    () =>
      import("./historical-data/historical-data.component").then(
        (c) => c.HistoricalDataComponent,
      ),
  ],
];
