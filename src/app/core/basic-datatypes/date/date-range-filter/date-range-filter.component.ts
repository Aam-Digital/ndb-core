import {
  Component,
  effect,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { DateRangeFilterPanelComponent } from "./date-range-filter-panel/date-range-filter-panel.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormsModule } from "@angular/forms";
import { dateToString, isValidDate } from "../../../../utils/utils";
import { DateFilter } from "app/core/filter/filters/dateFilter";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-date-range-filter",
  templateUrl: "./date-range-filter.component.html",
  styleUrls: ["./date-range-filter.component.scss"],
  imports: [MatFormFieldModule, MatDatepickerModule, FormsModule],
})
export class DateRangeFilterComponent<T extends Entity> {
  private dialog = inject(MatDialog);

  fromDate: Date;
  toDate: Date;

  filterConfig = input<DateFilter<T>>();
  dateRangeChange = output<{ from: Date; to: Date }>();

  constructor() {
    effect((onCleanup) => {
      const filterConfig = this.filterConfig();
      if (!filterConfig) return;

      const sub = filterConfig.selectedOptionChange.subscribe(() => {
        if (filterConfig.selectedOptionValues.length === 0) {
          this.fromDate = undefined;
          this.toDate = undefined;
          this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
        }
      });
      this.initDates();
      onCleanup(() => sub.unsubscribe());
    });
  }

  private initDates() {
    const filterConfig = this.filterConfig();
    if (!filterConfig) return;
    const range = filterConfig.getDateRange();
    if (
      (range.start !== this.fromDate || range.start === undefined) &&
      (range.end !== this.toDate || range.end === undefined)
    ) {
      this.fromDate = range.start;
      this.toDate = range.end;
      filterConfig.selectedOptionChange.emit(filterConfig.selectedOptionValues);
      this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
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
