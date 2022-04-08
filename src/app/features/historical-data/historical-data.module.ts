import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HistoricalDataComponent } from "./historical-data/historical-data.component";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";

@NgModule({
  declarations: [HistoricalDataComponent],
  imports: [CommonModule, EntitySubrecordModule, EntityUtilsModule],
  exports: [HistoricalDataComponent],
})
export class HistoricalDataModule {
  static dynamicComponents = [HistoricalDataComponent];
}
