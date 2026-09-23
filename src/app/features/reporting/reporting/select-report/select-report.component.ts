import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { Angulartics2Module } from "angulartics2";
import { ExportDialogComponent } from "#src/app/core/export/export-dialog/export-dialog.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ReportEntity, reportUsesDateRange } from "../../report-config";
import { DateFilter } from "app/core/filter/filters/dateFilter";
import { DateRangeFilterComponent } from "app/core/basic-datatypes/date/date-range-filter/date-range-filter.component";
import { DateRangeFilterConfigOption } from "app/core/entity-list/EntityListConfig";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-select-report",
  templateUrl: "./select-report.component.html",
  styleUrls: ["./select-report.component.scss"],
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatDatepickerModule,
    Angulartics2Module,
    FontAwesomeModule,
    MatProgressBarModule,
    MatTooltipModule,
    DateRangeFilterComponent,
    FaDynamicIconComponent,
  ],
})
export class SelectReportComponent {
  private readonly dialog = inject(MatDialog);

  reports = input<ReportEntity[]>();
  loading = input<boolean>(false);
  exportableData = input<any>();

  /** Optionally overwrite the default time periods shown to users for quick selection */
  dateRangeOptions = input<DateRangeFilterConfigOption[]>();

  calculateClick = output<CalculateReportOptions>();
  selectedReportChange = output<ReportEntity>();
  reportFiltersChange = output<void>();

  selectedReport = linkedSignal<
    ReportEntity[] | undefined,
    ReportEntity | undefined
  >({
    source: this.reports,
    computation: (reports, previous) =>
      reports?.length === 1 ? reports[0] : previous?.value,
  });
  fromDate = signal<Date | undefined>(undefined);
  toDate = signal<Date | undefined>(undefined);
  /** whether the currently selected report includes filter parameters for a "from" - "to" date range */
  isDateRangeReport = computed<boolean>(() => {
    const report = this.selectedReport();
    if (!report) return false;
    // Primary signal: whether the report's queries actually use date placeholders.
    if (reportUsesDateRange(report)) return true;
    // Fallback for legacy configs that declared the date args explicitly:
    // v1 configs use neededArgs; v2/canonical use transformations.
    return (
      !!report.neededArgs?.find((a) => a === "from" || a === "startDate") ||
      !!report.neededArgs?.find((a) => a === "to" || a === "endDate") ||
      !!report.transformations?.["startDate"] ||
      !!report.transformations?.["endDate"]
    );
  });

  dateRangeFilterConfig = computed<DateFilter<any> | undefined>(() => {
    if (!this.isDateRangeReport()) return undefined;
    const options =
      this.dateRangeOptions()?.length > 0
        ? this.dateRangeOptions()
        : defaultReportDateFilters;
    return new DateFilter<any>("reportPeriod", "Enter a date range", options);
  });

  calculate(): void {
    if (!this.isDateRangeReport()) {
      this.fromDate.set(undefined);
      this.toDate.set(undefined);
    }

    this.calculateClick.emit({
      report: this.selectedReport(),
      from: this.fromDate(),
      to: this.toDate(),
    });
  }

  reportChange() {
    this.selectedReportChange.emit(this.selectedReport());
  }

  onDateRangeChange(event: { from: Date; to: Date }) {
    this.fromDate.set(event.from);
    this.toDate.set(event.to);
    this.reportFiltersChange.emit();
  }

  openExportDialog() {
    this.dialog.open(ExportDialogComponent, {
      data: {
        allEntities: () => Promise.resolve(this.exportableData()),
        filename: this.baseExportFileName,
      },
    });
  }

  get baseExportFileName(): string {
    const reportName =
      this.selectedReport()
        ?.title?.replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim() || "report";
    const datePart = this.getDatePart();
    return datePart ? `${reportName} ${datePart}` : reportName;
  }

  private getDatePart(): string {
    if (this.fromDate() && this.toDate()) {
      return `${this.formatDate(this.fromDate())}_${this.formatDate(this.toDate())}`;
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
