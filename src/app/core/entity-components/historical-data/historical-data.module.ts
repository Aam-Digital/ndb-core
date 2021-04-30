import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { HistoricalDataComponent } from "./historical-data/historical-data.component";
import { EntitySubrecordModule } from "../entity-subrecord/entity-subrecord.module";

@NgModule({
  declarations: [HistoricalDataComponent],
  imports: [CommonModule, EntitySubrecordModule],
  exports: [HistoricalDataComponent],
  providers: [DatePipe],
})
export class HistoricalDataModule {}
