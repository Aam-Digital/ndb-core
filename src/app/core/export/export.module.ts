import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { ExportDataDirective } from "./export-data-directive/export-data.directive";

@NgModule({
  declarations: [ExportDataDirective],
  imports: [CommonModule, MatButtonModule],
  exports: [ExportDataDirective],
})
export class ExportModule {}
