import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Entity } from "app/core/entity/model/entity";
import { DateFilter, Filter } from "../filters/filters";
import { DateRangeFilterPanelComponent } from "./date-range-filter-panel/date-range-filter-panel.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormsModule } from "@angular/forms";
import { dateToString, isValidDate } from "app/utils/utils";

@Component({
  selector: "app-date-range-filter",
  templateUrl: "./date-range-filter.component.html",
  styleUrls: ["./date-range-filter.component.scss"],
  standalone: true,
  imports: [MatFormFieldModule, MatDatepickerModule, FormsModule],
})
export class DateRangeFilterComponent<T extends Entity> {
  fromDate: Date;
  toDate: Date;
  dateFilter: DateFilter<T>;

  @Output() selectedOptionChange = new EventEmitter<string>();

  @Input() set filterConfig(value: Filter<T>) {
    this.dateFilter = value as DateFilter<T>;
    this.initDates();
  }

  constructor(private dialog: MatDialog) {}

  private initDates() {
    const range = this.dateFilter.getDateRange();
    if (
      (range.start !== this.fromDate || range.start === undefined) &&
      (range.end !== this.toDate || range.end === undefined)
    ) {
      this.fromDate = range.start;
      this.toDate = range.end;
      this.selectedOptionChange.emit(this.dateFilter.selectedOption);
    }
  }

  dateChangedManually() {
    this.dateFilter.selectedOption =
      (isValidDate(this.fromDate) ? dateToString(this.fromDate) : "") +
      "_" +
      (isValidDate(this.toDate) ? dateToString(this.toDate) : "");
    this.selectedOptionChange.emit(this.dateFilter.selectedOption);
  }

  openDialog(e: Event) {
    e.stopPropagation();
    this.dialog
      .open(DateRangeFilterPanelComponent, {
        width: "600px",
        minWidth: "400px",
        data: this.dateFilter,
      })
      .afterClosed()
      .subscribe(() => this.initDates());
  }
}
