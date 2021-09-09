import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataImportComponent } from "./data-import/data-import.component";
import { BackupService } from "app/core/admin/services/backup.service";

@NgModule({
  declarations: [DataImportComponent],
  imports: [CommonModule],
  exports: [DataImportComponent],
})
export class DataImportModule {}
