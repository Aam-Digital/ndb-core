import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { DateRangeFilterPanelComponent } from "./date-range-filter-panel/date-range-filter-panel.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormsModule } from "@angular/forms";
import { dateToString, isValidDate } from "../../../../utils/utils";
import { DateFilter } from "app/core/filter/filters/dateFilter";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EMPTY_FILTER_OPTION_KEY } from "app/core/filter/filters/filters";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-date-range-filter",
  templateUrl: "./date-range-filter.component.html",
  styleUrls: ["./date-range-filter.component.scss"],
  imports: [
    MatFormFieldModule,
    MatDatepickerModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    FormsModule,
    FaIconComponent,
  ],
})
export class DateRangeFilterComponent<T extends Entity> implements OnChanges {
  private dialog = inject(MatDialog);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  fromDate: Date | null = null;
  toDate: Date | null = null;

  @Input() filterConfig: DateFilter<T>;
  @Output() dateRangeChange = new EventEmitter<{
    from: Date | null;
    to: Date | null;
  }>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.filterConfig) {
      this.filterConfig.selectedOptionChange
        .pipe(untilDestroyed(this))
        .subscribe(() => this.initDates());
      this.initDates();
    }
  }

  private initDates() {
    const range = this.filterConfig.getDateRange();
    if (range.start !== this.fromDate || range.end !== this.toDate) {
      this.fromDate = range.start ?? null;
      this.toDate = range.end ?? null;
      this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
      this.changeDetectorRef.markForCheck();
    }
  }

  dateChangedManually() {
    this.filterConfig.selectedOptionValues = [
      isValidDate(this.fromDate) ? dateToString(this.fromDate) : "",
      isValidDate(this.toDate) ? dateToString(this.toDate) : "",
    ];
    this.filterConfig.selectedOptionChange.emit(
      this.filterConfig.selectedOptionValues,
    );
    this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
  }

  isNoDateFilterActive(): boolean {
    return (
      this.filterConfig?.selectedOptionValues?.[0] === EMPTY_FILTER_OPTION_KEY
    );
  }

  isAnyDateFilterActive(): boolean {
    return this.filterConfig?.selectedOptionValues?.length > 0;
  }

  resetNoDateFilter(): void {
    this.filterConfig.selectedOptionValues = [];
    this.filterConfig.selectedOptionChange.emit(
      this.filterConfig.selectedOptionValues,
    );
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
        data: this.filterConfig,
      })
      .afterClosed()
      .subscribe(() => this.initDates());
  }
}
