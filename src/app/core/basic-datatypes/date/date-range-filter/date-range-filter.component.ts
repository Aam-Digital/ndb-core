import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { DateRangeFilterPanelComponent } from "./date-range-filter-panel/date-range-filter-panel.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormsModule } from "@angular/forms";
import { dateToString, isValidDate } from "../../../../utils/utils";
import { DateFilter } from "app/core/filter/filters/dateFilter";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
  selector: "app-date-range-filter",
  templateUrl: "./date-range-filter.component.html",
  styleUrls: ["./date-range-filter.component.scss"],
  imports: [MatFormFieldModule, MatDatepickerModule, FormsModule],
})
export class DateRangeFilterComponent<T extends Entity> implements OnChanges {
  private dialog = inject(MatDialog);

  fromDate: Date;
  toDate: Date;

  @Input() filterConfig: DateFilter<T>;
  @Output() dateRangeChange = new EventEmitter<{ from: Date; to: Date }>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.filterConfig) {
      this.filterConfig.selectedOptionChange
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          if (this.filterConfig.selectedOptionValues.length === 0) {
            this.fromDate = undefined;
            this.toDate = undefined;
            this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
          }
        });
      this.initDates();
    }
  }

  private initDates() {
    const range = this.filterConfig.getDateRange();
    if (
      (range.start !== this.fromDate || range.start === undefined) &&
      (range.end !== this.toDate || range.end === undefined)
    ) {
      this.fromDate = range.start;
      this.toDate = range.end;
      this.filterConfig.selectedOptionChange.emit(
        this.filterConfig.selectedOptionValues,
      );
      this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
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
