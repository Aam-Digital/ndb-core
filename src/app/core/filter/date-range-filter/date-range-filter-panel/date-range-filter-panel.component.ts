import { Component, Inject } from "@angular/core";
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
} from "app/core/entity-components/entity-list/EntityListConfig";
import moment from "moment";
import { FormsModule } from "@angular/forms";

const defaultOptions: DateRangeFilterConfigOption[] = [
  {
    label: $localize`:Filter label:Today`,
  },
  {
    startOffsets: [{ amount: 0, unit: "weeks" }],
    endOffsets: [{ amount: 0, unit: "weeks" }],
    label: $localize`:Filter label:This week`,
  },
  {
    startOffsets: [{ amount: 1, unit: "weeks" }],
    label: $localize`:Filter label:Since last week`,
  },
  {
    startOffsets: [{ amount: 0, unit: "months" }],
    endOffsets: [{ amount: 0, unit: "months" }],

    label: $localize`:Filter label:This month`,
  },
  {
    startOffsets: [{ amount: 1, unit: "months" }],
    endOffsets: [{ amount: -1, unit: "months" }],
    label: $localize`:Filter label:Last month`,
  },
];

@Component({
  selector: "app-date-range-filter-panel",
  templateUrl: "./date-range-filter-panel.component.html",
  styleUrls: ["./date-range-filter-panel.component.scss"],
  providers: [
    { provide: MatDateSelectionModel, useClass: MatRangeDateSelectionModel },
  ],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    NgForOf,
    FormsModule,
  ],
})
export class DateRangeFilterPanelComponent {
  dateRangeFilterConfig: DateRangeFilterConfig;
  dateRangeOptions: DateRangeFilterConfigOption;

  originalRangeValue;
  selectedRangeValue: DateRange<Date>;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      fromDate: Date;
      toDate: Date;
      dateRangeFilterConfig: DateRangeFilterConfig;
    },
    private dialogRef: MatDialogRef<DateRangeFilterPanelComponent>
  ) {
    this.selectedRangeValue = new DateRange(data.fromDate, data.toDate);
    this.originalRangeValue = this.selectedRangeValue;
    if (!this.data.dateRangeFilterConfig.options) {
      this.data.dateRangeFilterConfig.options = defaultOptions;
    }
  }

  private calculateDateRange(dateRangeOption): [start: Date, end: Date] {
    const startOffsets = dateRangeOption.startOffsets ?? [
      { amount: 0, unit: "days" },
    ];
    const endOffsets = dateRangeOption.endOffsets ?? [
      { amount: 0, unit: "days" },
    ];

    const start = moment();
    const end = moment();

    startOffsets.forEach((offset) =>
      start.subtract(offset.amount, offset.unit)
    );
    endOffsets.forEach((offset) => end.add(offset.amount, offset.unit));

    start.startOf(startOffsets[0].unit);
    end.endOf(endOffsets[0].unit);

    return [start.toDate(), end.toDate()];
  }

  preselectRange(dateRangeOption): void {
    const [start, end] = this.calculateDateRange(dateRangeOption);
    this.selectedRangeValue = new DateRange(start, end);
  }

  unselectRange() {
    this.selectedRangeValue = this.originalRangeValue;
  }

  selectRangeAndClose(dateRangeOption): void {
    this.preselectRange(dateRangeOption);
    this.dialogRef.close(this.selectedRangeValue);
  }

  selectedRangeChange(selectedDate: Date) {
    if (!this.selectedRangeValue?.start || this.selectedRangeValue?.end) {
      this.selectedRangeValue = new DateRange(selectedDate, null);
    } else {
      const start = this.selectedRangeValue.start;
      const end = selectedDate;
      this.selectedRangeValue =
        end < start ? new DateRange(end, start) : new DateRange(start, end);
      this.dialogRef.close(this.selectedRangeValue);
    }
    console.log(this.selectedRangeValue);
  }
}
