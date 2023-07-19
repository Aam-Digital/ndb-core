import { ComponentTuple } from "../../dynamic-components";

export const dataImportComponents: ComponentTuple[] = [
  [
    "Import",
    () =>
      import("./data-import/data-import.component").then(
        (c) => c.DataImportComponent
      ),
  ],
];
