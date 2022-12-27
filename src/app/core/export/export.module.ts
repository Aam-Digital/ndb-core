import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { ExportDataDirective } from "./export-data-directive/export-data.directive";
import { DownloadService } from "./download-service/download.service";

@NgModule({
  declarations: [ExportDataDirective],
  imports: [CommonModule, MatButtonModule],
  providers: [DownloadService],
  exports: [ExportDataDirective],
})
export class ExportModule {}
