import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { ExportDataDirective } from "./export-data-directive/export-data.directive";
import { DownloadDialogService } from "./download-dialog/download-dialog.service";

@NgModule({
  declarations: [ExportDataDirective],
  imports: [CommonModule, MatButtonModule],
  providers: [DownloadDialogService],
  exports: [ExportDataDirective],
})
export class ExportModule {}
