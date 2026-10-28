import {
  Component,
  inject,
  Injectable,
  ChangeDetectionStrategy,
  signal,
} from "@angular/core";
import {
  DateRange,
  DefaultMatCalendarRangeStrategy,
  MAT_DATE_RANGE_SELECTION_STRATEGY,
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

/**
 * Shows the range up to the day that is hovered, after the start date was picked in the calendar.
 * If that day is before the start date, the range is shown the other way round, as the panel orders the picked dates.
 *
 * Dragging the ends of a selected range is not supported, so that is not previewed either.
 */
@Injectable()
export class RangePreviewStrategy extends DefaultMatCalendarRangeStrategy<Date> {
  override createPreview(
    activeDate: Date | null,
    currentRange: DateRange<Date>,
  ): DateRange<Date> {
    if (!currentRange.start || currentRange.end || !activeDate) {
      return new DateRange(null, null);
    }
    return activeDate < currentRange.start
      ? new DateRange(activeDate, currentRange.start)
      : new DateRange(currentRange.start, activeDate);
  }

  override createDrag(): null {
    return null;
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-date-range-filter-panel",
  templateUrl: "./date-range-filter-panel.component.html",
  styleUrls: ["./date-range-filter-panel.component.scss"],
  providers: [
    { provide: MatDateSelectionModel, useClass: MatRangeDateSelectionModel },
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: RangePreviewStrategy,
    },
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
    /**
     * For selecting the dates of a field rather than a filter:
     * no "All" option, and without given dates nothing is selected initially.
     */
    hideAllOption?: boolean;
    /** a range shaded in the calendar while no predefined range is hovered (e.g. the period of a parent record) */
    highlightRange?: DateRange<Date>;
  };
  private dialogRef =
    inject<MatDialogRef<DateRangeFilterPanelComponent>>(MatDialogRef);

  readonly showAllOption = !this.data?.hideAllOption;

  selectedRangeValue = signal<DateRange<Date>>(
    this.showAllOption
      ? new DateRange(
          this.data?.dateRange?.start ?? new Date("1900-01-01"),
          this.data?.dateRange?.end ?? new Date("2999-12-31"),
        )
      : new DateRange(
          this.data?.dateRange?.start ?? null,
          this.data?.dateRange?.end ?? null,
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
  private readonly highlightRange =
    this.data?.highlightRange ?? new DateRange<Date>(null, null);
  comparisonRange = signal<DateRange<Date>>(this.highlightRange);

  preselectRange(dateRangeOption): void {
    this.comparisonRange.set(calculateDateRange(dateRangeOption));
  }

  preselectAllRange(): void {
    this.comparisonRange.set(
      new DateRange(new Date("1900-01-01"), new Date("2999-12-31")),
    );
  }

  unselectRange() {
    this.comparisonRange.set(this.highlightRange);
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
