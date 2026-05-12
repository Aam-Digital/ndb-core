import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { DateRangeFilterPanelComponent } from "./date-range-filter-panel/date-range-filter-panel.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormsModule } from "@angular/forms";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { dateToString, isValidDate } from "../../../../utils/utils";
import { DateFilter } from "app/core/filter/filters/dateFilter";
import { EMPTY_FILTER_OPTION_KEY } from "app/core/filter/filters/filters";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-date-range-filter",
  templateUrl: "./date-range-filter.component.html",
  styleUrls: ["./date-range-filter.component.scss"],
  imports: [
    MatFormFieldModule,
    MatDatepickerModule,
    MatButtonModule,
    MatTooltipModule,
    FormsModule,
    FaIconComponent,
  ],
})
export class DateRangeFilterComponent<T extends Entity> {
  private dialog = inject(MatDialog);
  private readonly selectedOptionVersion = signal(0);

  readonly fromDate = signal<Date | null>(null);
  readonly toDate = signal<Date | null>(null);

  filterConfig = input<DateFilter<T>>();
  dateRangeChange = output<{ from: Date | null; to: Date | null }>();
  readonly isNoDateFilterActive = computed(() => {
    this.selectedOptionVersion();
    return (
      this.filterConfig()?.selectedOptionValues?.[0] === EMPTY_FILTER_OPTION_KEY
    );
  });
  readonly isAnyDateFilterActive = computed(() => {
    this.selectedOptionVersion();
    return (this.filterConfig()?.selectedOptionValues?.length ?? 0) > 0;
  });
  private readonly selectedRange = computed(() => {
    this.selectedOptionVersion();
    const filterConfig = this.filterConfig();
    if (!filterConfig) {
      return { from: null as Date | null, to: null as Date | null };
    }
    const range = filterConfig.getDateRange();
    return { from: range.start ?? null, to: range.end ?? null };
  });

  constructor() {
    effect((onCleanup) => {
      const filterConfig = this.filterConfig();
      if (!filterConfig) return;

      const sub = filterConfig.selectedOptionChange.subscribe(() => {
        this.selectedOptionVersion.update((version) => version + 1);
      });
      onCleanup(() => sub.unsubscribe());
    });

    effect(() => {
      const range = this.selectedRange();
      this.fromDate.set(range.from);
      this.toDate.set(range.to);
      this.dateRangeChange.emit({ from: range.from, to: range.to });
    });
  }

  dateChangedManually() {
    const filterConfig = this.filterConfig();
    if (!filterConfig) return;
    const from = this.fromDate();
    const to = this.toDate();
    filterConfig.selectedOptionValues = [
      isValidDate(from) ? dateToString(from) : "",
      isValidDate(to) ? dateToString(to) : "",
    ];
    filterConfig.selectedOptionChange.emit(filterConfig.selectedOptionValues);
  }

  resetNoDateFilter(): void {
    const filterConfig = this.filterConfig();
    if (!filterConfig) return;
    filterConfig.selectedOptionValues = [];
    filterConfig.selectedOptionChange.emit(filterConfig.selectedOptionValues);
  }

  openDialog(e: Event) {
    e.stopPropagation();
    this.dialog
      .open(DateRangeFilterPanelComponent, {
        width: "600px",
        minWidth: "400px",
        data: this.filterConfig(),
      })
      .afterClosed()
      .subscribe(() => {
        this.selectedOptionVersion.update((version) => version + 1);
      });
  }
}
