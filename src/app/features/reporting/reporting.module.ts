import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReportingComponent } from "./reporting/reporting.component";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatTableModule } from "@angular/material/table";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatStepperModule } from "@angular/material/stepper";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { ExportModule } from "../../core/export/export.module";
import { ReportRowComponent } from "./reporting/report-row/report-row.component";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSelectModule } from "@angular/material/select";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Angulartics2Module } from "angulartics2";
import { ViewModule } from "../../core/view/view.module";
import { SelectReportComponent } from "./reporting/select-report/select-report.component";
import { MatSortModule } from "@angular/material/sort";
import { ObjectTableComponent } from "./reporting/object-table/object-table.component";
import { MatTreeModule } from "@angular/material/tree";

@NgModule({
  declarations: [
    ReportingComponent,
    ReportRowComponent,
    SelectReportComponent,
    ObjectTableComponent,
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatListModule,
    MatTableModule,
    MatExpansionModule,
    MatStepperModule,
    MatDatepickerModule,
    MatFormFieldModule,
    FormsModule,
    ExportModule,
    MatProgressBarModule,
    MatSelectModule,
    FontAwesomeModule,
    Angulartics2Module,
    ViewModule,
    MatSortModule,
    MatTreeModule,
  ],
  exports: [SelectReportComponent, ReportingComponent],
})
export class ReportingModule {
  static dynamicComponents = [ReportingComponent];
}
