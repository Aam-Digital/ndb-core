import { Component, Inject } from "@angular/core";
import {
  DateRange,
  MAT_RANGE_DATE_SELECTION_MODEL_PROVIDER,
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
import { DateRangeFilterConfigOption } from "../../../../entity-list/EntityListConfig";
import moment from "moment";
import { FormsModule } from "@angular/forms";
import { dateToString } from "../../../../../utils/utils";
import { DateFilter } from "../../../../filter/filters/dateFilter";

export const defaultDateFilters: DateRangeFilterConfigOption[] = [
  {
    label: $localize`:Filter label:Today`,
  },
  {
    startOffsets: [{ amount: 0, unit: "weeks" }],
    endOffsets: [{ amount: 0, unit: "weeks" }],
    label: $localize`:Filter label:This week`,
  },
  {
    startOffsets: [{ amount: -1, unit: "weeks" }],
    label: $localize`:Filter label:Since last week`,
  },
  {
    startOffsets: [{ amount: 0, unit: "months" }],
    endOffsets: [{ amount: 0, unit: "months" }],
    label: $localize`:Filter label:This month`,
  },
  {
    startOffsets: [{ amount: -1, unit: "months" }],
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
    MAT_RANGE_DATE_SELECTION_MODEL_PROVIDER,
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
  selectedRangeValue: DateRange<Date>;
  selectedOption: DateRangeFilterConfigOption;
  comparisonRange: DateRange<Date> = new DateRange(null, null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public filter: DateFilter<any>,
    private dialogRef: MatDialogRef<DateRangeFilterPanelComponent>,
  ) {
    this.selectedRangeValue = new DateRange(
      this.filter.getDateRange().start ?? new Date("1900-01-01"),
      this.filter.getDateRange().end ?? new Date("2999-12-31"),
    );
    this.selectedOption = this.filter.getSelectedOption();
  }

  preselectRange(dateRangeOption): void {
    this.comparisonRange = calculateDateRange(dateRangeOption);
  }

  preselectAllRange(): void {
    this.comparisonRange = new DateRange(
      new Date("1900-01-01"),
      new Date("2999-12-31"),
    );
  }

  unselectRange() {
    this.comparisonRange = new DateRange(null, null);
  }

  selectRangeAndClose(index: number | "all"): void {
    if (typeof index === "number") {
      this.filter.selectedOptionValues = [index.toString()];
    } else {
      this.filter.selectedOptionValues = [];
    }
    this.dialogRef.close();
  }

  selectedRangeChange(selectedDate: Date) {
    if (!this.selectedRangeValue?.start || this.selectedRangeValue?.end) {
      this.selectedRangeValue = new DateRange(selectedDate, null);
    } else {
      const start: Date = this.selectedRangeValue.start;
      this.filter.selectedOptionValues =
        start < selectedDate
          ? [dateToString(start), dateToString(selectedDate)]
          : [dateToString(selectedDate), dateToString(start)];
      this.dialogRef.close();
    }
  }
}

export function calculateDateRange(
  dateRangeOption: DateRangeFilterConfigOption,
): DateRange<Date> {
  const startOffsets = dateRangeOption.startOffsets ?? [
    { amount: 0, unit: "days" },
  ];
  const endOffsets = dateRangeOption.endOffsets ?? [
    { amount: 0, unit: "days" },
  ];

  const start = moment();
  const end = moment();

  startOffsets.forEach((offset) => start.add(offset.amount, offset.unit));
  endOffsets.forEach((offset) => end.add(offset.amount, offset.unit));

  start.startOf(startOffsets[0].unit);
  end.endOf(endOffsets[0].unit);

  return new DateRange(start.toDate(), end.toDate());
}
