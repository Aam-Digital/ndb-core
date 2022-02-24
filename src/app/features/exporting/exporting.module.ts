import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ExportingComponent } from "./exporting/exporting.component";
import { ReportingModule } from "../reporting/reporting.module";
import { ViewModule } from "../../core/view/view.module";

@NgModule({
  declarations: [ExportingComponent],
  imports: [CommonModule, ViewModule, ReportingModule],
})
export class ExportingModule {}
