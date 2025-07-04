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
import { DateFilter } from "app/core/filter/filters/dateFilter";
import { DateRangeFilterComponent } from "app/core/basic-datatypes/date/date-range-filter/date-range-filter.component";
import { DateRangeFilterConfigOption } from "app/core/entity-list/EntityListConfig";

export const defaultReportDateFilters: DateRangeFilterConfigOption[] = [
  {
    startOffsets: [{ amount: 0, unit: "months" }],
    endOffsets: [{ amount: 0, unit: "months" }],
    label: $localize`:Filter label: Current month`,
  },
  {
    startOffsets: [{ amount: -1, unit: "months" }],
    endOffsets: [{ amount: -1, unit: "months" }],
    label: $localize`:Filter label: Last month`,
  },
  {
    startOffsets: [{ amount: 0, unit: "quarter" }],
    endOffsets: [{ amount: 0, unit: "quarter" }],
    label: $localize`:Filter label: Current quarter`,
  },
  {
    startOffsets: [{ amount: -1, unit: "quarters" }],
    endOffsets: [{ amount: -1, unit: "quarters" }],
    label: $localize`:Filter label: Last quarter`,
  },
  {
    startOffsets: [{ amount: 0, unit: "years" }],
    endOffsets: [{ amount: 0, unit: "years" }],
    label: $localize`:Filter label: Current year`,
  },
  {
    startOffsets: [{ amount: -1, unit: "years" }],
    endOffsets: [{ amount: -1, unit: "years" }],
    label: $localize`:Filter label: Last year`,
  },
];

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
    DateRangeFilterComponent,
  ],
})
export class SelectReportComponent implements OnChanges {
  @Input() reports: ReportEntity[];
  @Input() loading: boolean;
  @Input() exportableData: any;

  /** Optionally overwrite the default time periods shown to users for quick selection */
  @Input() dateRangeOptions?: DateRangeFilterConfigOption[];

  @Output() calculateClick = new EventEmitter<CalculateReportOptions>();
  @Output() dataChanged = new EventEmitter<void>();

  selectedReport: ReportEntity;
  fromDate: Date;
  toDate: Date;
  /** whether the currently selected report includes filter parameters for a "from" - "to" date range */
  isDateRangeReport: boolean;

  dateRangeFilterConfig: DateFilter<any>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("reports")) {
      if (this.reports?.length === 1) {
        this.selectedReport = this.reports[0];
        this.checkDateRangeReport();
        this.setupDateRangeFilter();
      }
    }

    if (changes.hasOwnProperty("dateRangeOptions")) {
      this.setupDateRangeFilter();
    }
  }

  calculate(): void {
    if (!this.isDateRangeReport) {
      this.fromDate = undefined;
      this.toDate = undefined;
    }

    this.calculateClick.emit({
      report: this.selectedReport,
      from: this.fromDate,
      to: this.toDate,
    });
  }

  reportChange() {
    this.dataChanged.emit();
    this.checkDateRangeReport();
    this.setupDateRangeFilter();
  }

  onDateRangeChange(event: { from: Date; to: Date }) {
    this.fromDate = event.from;
    this.toDate = event.to;
    this.dataChanged.emit();
  }

  private checkDateRangeReport(): void {
    if (this.selectedReport.mode !== "sql") {
      this.isDateRangeReport = true;
    } else if (
      this.selectedReport.version == 1 ||
      this.selectedReport.version == undefined
    ) {
      this.isDateRangeReport =
        this.selectedReport.neededArgs.indexOf("from") !== -1 ||
        this.selectedReport.neededArgs.indexOf("to") !== -1;
    } else if (this.selectedReport.version == 2) {
      this.isDateRangeReport =
        !!this.selectedReport.transformations["startDate"] ||
        !!this.selectedReport.transformations["endDate"];
    } else {
      this.isDateRangeReport = false;
    }
  }

  private setupDateRangeFilter(): void {
    if (this.isDateRangeReport) {
      const options =
        this.dateRangeOptions && this.dateRangeOptions.length > 0
          ? this.dateRangeOptions
          : defaultReportDateFilters;
      this.dateRangeFilterConfig = new DateFilter<any>(
        "reportPeriod",
        "Enter a date range",
        options,
      );
    } else {
      this.dateRangeFilterConfig = undefined;
    }
  }

  get exportFileName(): string {
    const reportName = this.getReportName();
    const datePart = this.getDatePart();
    return datePart ? `${reportName} ${datePart}.csv` : `${reportName}.csv`;
  }

  private getReportName(): string {
    return (
      this.selectedReport?.title
        ?.replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim() || "report"
    );
  }

  private getDatePart(): string {
    if (this.fromDate && this.toDate) {
      return `${this.formatDate(this.fromDate)}_${this.formatDate(this.toDate)}`;
    }
    return "";
  }

  private formatDate(date: Date): string {
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
}

interface CalculateReportOptions {
  report: ReportEntity;
  from: Date;
  to: Date;
}
