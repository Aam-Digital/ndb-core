import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReportingComponent } from "./reporting/reporting.component";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyListModule as MatListModule } from "@angular/material/legacy-list";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatStepperModule } from "@angular/material/stepper";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { FormsModule } from "@angular/forms";
import { ExportModule } from "../../core/export/export.module";
import { ReportRowComponent } from "./reporting/report-row/report-row.component";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
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
