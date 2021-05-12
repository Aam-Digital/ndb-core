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
import { AdminModule } from "../../core/admin/admin.module";
import { ReportRowComponent } from "./reporting/report-row/report-row.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

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
    AdminModule,
    MatProgressSpinnerModule,
  ],
})
export class ReportingModule {}
