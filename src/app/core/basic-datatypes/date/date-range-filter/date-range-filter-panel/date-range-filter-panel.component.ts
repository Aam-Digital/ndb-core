import { Component, inject } from "@angular/core";
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
import { DateRangeFilterConfigOption } from "../../../../entity-list/EntityListConfig";
import { FormsModule } from "@angular/forms";
import { dateToString } from "../../../../../utils/utils";
import { DateFilter } from "app/core/filter/filters/dateFilter";
import { calculateDateRange } from "./date-range-utils";

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
  ],
  imports: [MatDialogModule, MatButtonModule, MatDatepickerModule, FormsModule],
})
export class DateRangeFilterPanelComponent {
  filter = inject<DateFilter<any>>(MAT_DIALOG_DATA);
  private dialogRef =
    inject<MatDialogRef<DateRangeFilterPanelComponent>>(MatDialogRef);

  selectedRangeValue: DateRange<Date>;
  selectedOption: DateRangeFilterConfigOption;
  comparisonRange: DateRange<Date> = new DateRange(null, null);

  constructor() {
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
