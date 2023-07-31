import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";

/**
 * UI enabling users to import data from spreadsheets through a guided workflow.
 */
@NgModule({})
export class ImportModule {
  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "Import",
        () =>
          import("./import/import.component").then((c) => c.ImportComponent),
      ],
    ]);
  }
}
