import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";

@NgModule({})
export class ConfigSetupModule {
  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "ConfigImport",
        () =>
          import("./config-import/config-import.component").then(
            (c) => c.ConfigImportComponent,
          ),
      ],
    ]);
  }
}
