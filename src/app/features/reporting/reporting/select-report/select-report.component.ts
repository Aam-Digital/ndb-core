import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { NgForOf, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { Angulartics2Module } from "angulartics2";
import { ExportDataDirective } from "../../../../core/export/export-data-directive/export-data.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ReportEntity } from "../../report-config";

@Component({
  selector: "app-select-report",
  templateUrl: "./select-report.component.html",
  styleUrls: ["./select-report.component.scss"],
  imports: [
    NgIf,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    NgForOf,
    FormsModule,
    MatDatepickerModule,
    Angulartics2Module,
    ExportDataDirective,
    FontAwesomeModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  standalone: true,
})
export class SelectReportComponent implements OnChanges {
  @Input() reports: ReportEntity[];
  @Input() loading: boolean;
  @Input() exportableData: any;
  @Output() calculateClick = new EventEmitter<CalculateReportOptions>();

  selectedReport: ReportEntity;
  fromDate: Date;
  toDate: Date;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("reports")) {
      if (this.reports?.length === 1) {
        this.selectedReport = this.reports[0];
      }
    }
  }
}

interface CalculateReportOptions {
  report: ReportEntity;
  from: Date;
  to: Date;
}
