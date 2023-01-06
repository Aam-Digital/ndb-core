import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { historicalDataComponents } from "./historical-data-components";

@NgModule({})
export class HistoricalDataModule {
  constructor(components: ComponentRegistry) {
    components.addAll(historicalDataComponents);
  }
}
