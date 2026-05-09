import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  output,
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
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  fromDate: Date | null = null;
  toDate: Date | null = null;

  filterConfig = input<DateFilter<T>>();
  dateRangeChange = output<{ from: Date | null; to: Date | null }>();

  constructor() {
    effect((onCleanup) => {
      const filterConfig = this.filterConfig();
      if (!filterConfig) return;

      const sub = filterConfig.selectedOptionChange.subscribe(() =>
        this.initDates(),
      );
      this.initDates();
      onCleanup(() => sub.unsubscribe());
    });
  }

  private initDates() {
    const filterConfig = this.filterConfig();
    if (!filterConfig) return;
    const range = filterConfig.getDateRange();
    if (range.start !== this.fromDate || range.end !== this.toDate) {
      this.fromDate = range.start ?? null;
      this.toDate = range.end ?? null;
      this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
      this.changeDetectorRef.markForCheck();
    }
  }

  dateChangedManually() {
    const filterConfig = this.filterConfig();
    if (!filterConfig) return;
    filterConfig.selectedOptionValues = [
      isValidDate(this.fromDate) ? dateToString(this.fromDate) : "",
      isValidDate(this.toDate) ? dateToString(this.toDate) : "",
    ];
    filterConfig.selectedOptionChange.emit(filterConfig.selectedOptionValues);
    this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
  }

  isNoDateFilterActive(): boolean {
    return (
      this.filterConfig()?.selectedOptionValues?.[0] === EMPTY_FILTER_OPTION_KEY
    );
  }

  isAnyDateFilterActive(): boolean {
    return (this.filterConfig()?.selectedOptionValues?.length ?? 0) > 0;
  }

  resetNoDateFilter(): void {
    const filterConfig = this.filterConfig();
    if (!filterConfig) return;
    filterConfig.selectedOptionValues = [];
    filterConfig.selectedOptionChange.emit(filterConfig.selectedOptionValues);
    this.fromDate = null;
    this.toDate = null;
    this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
    this.changeDetectorRef.markForCheck();
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
      .subscribe(() => this.initDates());
  }
}
