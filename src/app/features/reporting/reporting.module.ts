import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReportingComponent } from "./reporting/reporting.component";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatTableModule } from "@angular/material/table";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatStepperModule } from "@angular/material/stepper";
import { MatIconModule } from "@angular/material/icon";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { ExportModule } from "../../core/export/export.module";
import { ReportRowComponent } from "./reporting/report-row/report-row.component";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSelectModule } from "@angular/material/select";
import { FlexModule } from "@angular/flex-layout";
import { Angulartics2Module } from "angulartics2";

@NgModule({
  declarations: [ReportingComponent, ReportRowComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatListModule,
    MatTableModule,
    MatExpansionModule,
    MatStepperModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    FormsModule,
    ExportModule,
    MatProgressBarModule,
    MatSelectModule,
    FlexModule,
    Angulartics2Module,
  ],
})
export class ReportingModule {}
