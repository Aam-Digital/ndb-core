import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { dataImportComponents } from "./data-import-components";

@NgModule({})
export class DataImportModule {
  constructor(components: ComponentRegistry) {
    components.addAll(dataImportComponents);
  }
}
