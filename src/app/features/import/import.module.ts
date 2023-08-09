import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { EnumValueMappingComponent } from "./import-column-mapping/enum-value-mapping/enum-value-mapping.component";

/**
 * UI enabling users to import data from spreadsheets through a guided workflow.
 */
@NgModule({
  imports: [EnumValueMappingComponent],
})
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
