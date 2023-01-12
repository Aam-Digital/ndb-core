import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { historicalDataComponents } from "./historical-data-components";
import { HistoricalEntityData } from "./model/historical-entity-data";

@NgModule({})
export class HistoricalDataModule {
  static databaseEntities = [HistoricalEntityData];

  constructor(components: ComponentRegistry) {
    components.addAll(historicalDataComponents);
  }
}
