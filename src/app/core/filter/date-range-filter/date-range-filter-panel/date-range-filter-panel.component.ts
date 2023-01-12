import { Component, Inject } from "@angular/core";
import { DateAdapter } from "@angular/material/core";
import {
  DateRange,
  MatDatepickerModule,
  MatDateSelectionModel,
  MatRangeDateSelectionModel,
} from "@angular/material/datepicker";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { NgForOf } from "@angular/common";

const customPresets = [
  "today",
  "last 7 days",
  "this week",
  "this month",
  "this year",
  "last week",
  "last month",
  "last year",
] as const;

// equivalent to "today" | "last 7 days" | … | "last year"
type CustomPreset = typeof customPresets[number];

@Component({
  selector: "app-date-range-filter-panel",
  templateUrl: "./date-range-filter-panel.component.html",
  styleUrls: ["./date-range-filter-panel.component.scss"],
  providers: [
    { provide: MatDateSelectionModel, useClass: MatRangeDateSelectionModel },
  ],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatDatepickerModule, NgForOf],
})
export class DateRangeFilterPanelComponent<D> {
  // list of range presets we want to provide:
  readonly customPresets = customPresets;

  selectedRangeValue: DateRange<D> | undefined;

  constructor(
    private dateAdapter: DateAdapter<D>,
    @Inject(MAT_DIALOG_DATA) public data,
    private dialogRef: MatDialogRef<DateRangeFilterPanelComponent<D>>
  ) {
    this.selectedRangeValue = new DateRange(data.fromDate, data.toDate);
  }

  private calculateDateRange(rangeName: CustomPreset): [start: D, end: D] {
    const today = this.today;
    const year = this.dateAdapter.getYear(today);

    // TODO: do this using config offsets?
    switch (rangeName) {
      case "today":
        return [today, today];

      case "last 7 days": {
        const start = this.dateAdapter.addCalendarDays(today, -6);
        return [start, today];
      }

      case "this week": {
        const start = this.dateAdapter.addCalendarDays(
          today,
          this.dateAdapter.getFirstDayOfWeek() -
            this.dateAdapter.getDayOfWeek(today)
        );
        return [start, today];
      }

      case "this month": {
        const start = this.dateAdapter.createDate(
          year,
          this.dateAdapter.getMonth(today),
          1
        );
        return [start, today];
      }

      case "this year": {
        const start = this.dateAdapter.createDate(year, 0, 1);
        const end = this.dateAdapter.createDate(year, 11, 31);
        return [start, end];
      }

      case "last week": {
        const end = this.dateAdapter.addCalendarDays(
          today,
          this.dateAdapter.getFirstDayOfWeek() -
            this.dateAdapter.getDayOfWeek(today) -
            1
        );
        const start = this.dateAdapter.addCalendarDays(end, -6);
        return [start, end];
      }

      case "last month": {
        const start = this.dateAdapter.addCalendarMonths(
          this.dateAdapter.createDate(
            year,
            this.dateAdapter.getMonth(today),
            1
          ),
          -1
        );
        const end = this.dateAdapter.addCalendarDays(
          this.dateAdapter.createDate(
            year,
            this.dateAdapter.getMonth(today),
            1
          ),
          -1
        );
        return [start, end];
      }

      case "last year": {
        const start = this.dateAdapter.createDate(year - 1, 0, 1);
        const end = this.dateAdapter.createDate(year - 1, 11, 31);
        return [start, end];
      }
    }
  }

  private get today(): D {
    const today = this.dateAdapter.getValidDateOrNull(new Date());
    if (today === null) {
      throw new Error("date creation failed");
    }
    return today;
  }

  // called when user selects a range preset:
  selectRange(rangeName: CustomPreset): void {
    const [start, end] = this.calculateDateRange(rangeName);
    this.selectedRangeValue = new DateRange(start, end);
    this.dialogRef.close(this.selectedRangeValue);
  }

  selectedRangeChange(m: any) {
    if (!this.selectedRangeValue?.start || this.selectedRangeValue?.end) {
      this.selectedRangeValue = new DateRange(m, null);
    } else {
      const start = this.selectedRangeValue.start;
      const end = m;
      if (end < start) {
        this.selectedRangeValue = new DateRange(end, start);
      } else {
        this.selectedRangeValue = new DateRange(start, end);
      }
      this.dialogRef.close(this.selectedRangeValue);
    }
  }
}
