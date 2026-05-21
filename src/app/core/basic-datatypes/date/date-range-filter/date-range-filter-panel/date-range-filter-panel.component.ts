import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
} from "@angular/core";
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
import { EMPTY_FILTER_OPTION_KEY } from "app/core/filter/filters/filters";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-date-range-filter-panel",
  templateUrl: "./date-range-filter-panel.component.html",
  styleUrls: ["./date-range-filter-panel.component.scss"],
  providers: [
    { provide: MatDateSelectionModel, useClass: MatRangeDateSelectionModel },
  ],
  imports: [MatDialogModule, MatButtonModule, MatDatepickerModule, FormsModule],
})
export class DateRangeFilterPanelComponent {
  readonly emptyFilterOptionKey = EMPTY_FILTER_OPTION_KEY;
  // Dialog input data (plain DTO) instead of full DateFilter instance
  private readonly data = inject<any>(MAT_DIALOG_DATA) as {
    selectedOptionValues?: string[];
    selectedOption?: DateRangeFilterConfigOption;
    dateRange?: DateRange<Date>;
    rangeOptions?: DateRangeFilterConfigOption[];
  };
  private dialogRef =
    inject<MatDialogRef<DateRangeFilterPanelComponent>>(MatDialogRef);

  selectedRangeValue = signal<DateRange<Date>>(
    new DateRange(
      this.data?.dateRange?.start ?? new Date("1900-01-01"),
      this.data?.dateRange?.end ?? new Date("2999-12-31"),
    ),
  );
  selectedOption = signal<DateRangeFilterConfigOption | undefined>(
    this.data?.selectedOption,
  );
  selectedOptionValues = signal<string[]>(
    this.data?.selectedOptionValues ?? [],
  );
  rangeOptions = signal<DateRangeFilterConfigOption[]>(
    this.data?.rangeOptions ?? [],
  );
  comparisonRange = signal<DateRange<Date>>(new DateRange(null, null));

  preselectRange(dateRangeOption): void {
    this.comparisonRange.set(calculateDateRange(dateRangeOption));
  }

  preselectAllRange(): void {
    this.comparisonRange.set(
      new DateRange(new Date("1900-01-01"), new Date("2999-12-31")),
    );
  }

  unselectRange() {
    this.comparisonRange.set(new DateRange(null, null));
  }

  selectRangeAndClose(index: number | "all" | "empty"): void {
    let result: string[] = [];
    if (typeof index === "number") {
      result = [index.toString()];
    } else if (index === "empty") {
      result = [EMPTY_FILTER_OPTION_KEY];
    } else {
      result = [];
    }
    this.selectedOptionValues.set(result);
    this.dialogRef.close({ selectedOptionValues: result });
  }

  selectedRangeChange(selectedDate: Date) {
    const current = this.selectedRangeValue();
    if (!current?.start || current?.end) {
      this.selectedRangeValue.set(new DateRange(selectedDate, null));
    } else {
      const start: Date = current.start as Date;
      const resultValues =
        start < selectedDate
          ? [dateToString(start), dateToString(selectedDate)]
          : [dateToString(selectedDate), dateToString(start)];
      this.selectedOptionValues.set(resultValues);
      this.dialogRef.close({ selectedOptionValues: resultValues });
    }
  }
}
