import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ExportDataButtonComponent } from "./export-data-button/export-data-button.component";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  declarations: [ExportDataButtonComponent],
  imports: [CommonModule, MatButtonModule],
  exports: [ExportDataButtonComponent],
})
export class ExportModule {}
