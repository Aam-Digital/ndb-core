import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { DiscreteImportConfigComponent } from "../basic-datatypes/discrete/discrete-import-config/discrete-import-config.component";

/**
 * UI enabling users to import data from spreadsheets through a guided workflow.
 */
@NgModule({
  imports: [DiscreteImportConfigComponent],
})
export class ImportModule {
  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "Import",
        () =>
          import("./import/import.component").then((c) => c.ImportComponent),
      ],
      [
        "DiscreteImportConfig",
        () =>
          import(
            "../basic-datatypes/discrete/discrete-import-config/discrete-import-config.component"
          ).then((c) => c.DiscreteImportConfigComponent),
      ],
      [
        "DateImportConfig",
        () =>
          import(
            "../basic-datatypes/date/date-import-config/date-import-config.component"
          ).then((c) => c.DateImportConfigComponent),
      ],
      [
        "EntityImportConfig",
        () =>
          import(
            "../basic-datatypes/entity/entity-import-config/entity-import-config.component"
          ).then((c) => c.EntityImportConfigComponent),
      ],
    ]);
  }
}
