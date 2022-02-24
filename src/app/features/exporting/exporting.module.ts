import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ExportingComponent } from "./exporting/exporting.component";
import { ReportingModule } from "../reporting/reporting.module";
import { ViewModule } from "../../core/view/view.module";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";

@NgModule({
  declarations: [ExportingComponent],
  imports: [
    CommonModule,
    ViewModule,
    ReportingModule,
    MatTableModule,
    MatSortModule,
  ],
})
export class ExportingModule {}
