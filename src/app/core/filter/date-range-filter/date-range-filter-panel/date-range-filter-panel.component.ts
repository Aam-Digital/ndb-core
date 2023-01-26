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
import {
  DateRangeFilterConfig,
  DateRangeFilterConfigOption,
  weekDayMap,
} from "app/core/entity-components/entity-list/EntityListConfig";
import moment from "moment";

const defaultOptions = [
  {
    label: "Today",
  },
  // {
  //   startOffsets: [{ amount: 3, unit: "days" }],
  //   label: "Last three days",
  // },
  {
    startOffsets: [{ amount: 0, unit: "weeks" }],
    label: "This week",
  },
  {
    startOffsets: [{ amount: 1, unit: "weeks" }],
    label: "Since last week",
  },
  {
    startOffsets: [{ amount: 0, unit: "months" }],
    endOffsets: [{ amount: 0, unit: "months" }],

    label: "This complete month",
  },
  {
    startOffsets: [{ amount: 1, unit: "months" }],
    endOffsets: [{ amount: -1, unit: "months" }],
    label: "Last month",
  },
  {
    startOffsets: [{ amount: -1, unit: "weeks" }],
    endOffsets: [{ amount: 1, unit: "weeks" }],
    label: "Next week",
  },
] as const;

const defaultStartingDayOfWeek = "Tuesday" as const;

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
export class DateRangeFilterPanelComponent {
  // list of range presets we want to provide:
  dateRangeFilterConfig: DateRangeFilterConfig;
  dateRangeOptions: DateRangeFilterConfigOption;

  selectedRangeValue: DateRange<Date> | undefined;

  constructor(
    private dateAdapter: DateAdapter<Date>,
    @Inject(MAT_DIALOG_DATA) public data,
    private dialogRef: MatDialogRef<DateRangeFilterPanelComponent>
  ) {
    this.selectedRangeValue = new DateRange(data.fromDate, data.toDate);
    if (!this.data.dateRangeFilterConfig.filterConfig.options) {
      this.data.dateRangeFilterConfig.filterConfig.options = defaultOptions;
    }
    const startingDayOfWeek =
      weekDayMap[
        (
          this.data.dateRangeFilterConfig.filterConfig.startingDayOfWeek ??
          defaultStartingDayOfWeek
        ).toLowerCase()
      ];
    moment.updateLocale(moment.locale(), {
      week: {
        dow: startingDayOfWeek,
      },
    });
  }

  private calculateDateRange(dateRangeOption): [start: Date, end: Date] {
    let start = dateRangeOption.startOffsets
      ? moment().startOf(dateRangeOption.startOffsets[0].unit)
      : moment().startOf("day");
    let end = dateRangeOption.endOffsets
      ? moment().endOf(dateRangeOption.startOffsets[0].unit)
      : moment().startOf("day");

    if (dateRangeOption.startOffsets) {
      dateRangeOption.startOffsets.forEach((offset) =>
        start.subtract(offset.amount, offset.unit)
      );
    }
    if (dateRangeOption.endOffsets) {
      dateRangeOption.endOffsets.forEach((offset) =>
        end.add(offset.amount, offset.unit)
      );
    }
    return [start.toDate(), end.toDate()];
  }

  private get today(): Date {
    const today = this.dateAdapter.getValidDateOrNull(new Date());
    if (today === null) {
      throw new Error("date creation failed");
    }
    return today;
  }

  // called when user selects a range preset:
  selectRange(dateRangeOption): void {
    const [start, end] = this.calculateDateRange(dateRangeOption);
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
