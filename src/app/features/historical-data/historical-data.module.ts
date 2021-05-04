import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HistoricalDataComponent } from "./historical-data/historical-data.component";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";

@NgModule({
  declarations: [HistoricalDataComponent],
  imports: [CommonModule, EntitySubrecordModule],
  exports: [HistoricalDataComponent],
})
export class HistoricalDataModule {}
