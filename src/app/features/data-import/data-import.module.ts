import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataImportComponent } from "./data-import/data-import.component";
import { DataImportService } from "./data-import.service";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  declarations: [DataImportComponent],
  imports: [CommonModule, MatButtonModule],
  exports: [DataImportComponent],
  providers: [DataImportService],
})
export class DataImportModule {}
