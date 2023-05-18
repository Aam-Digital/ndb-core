import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { DataFilter } from "app/core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Entity } from "app/core/entity/model/entity";
import moment from "moment";
import { DateFilter, Filter } from "../filters/filters";
import {
  DateRangeFilterPanelComponent,
  DateRangePanelResult,
  calculateDateRange,
} from "./date-range-filter-panel/date-range-filter-panel.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { DateRange, MatDatepickerModule } from "@angular/material/datepicker";
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
  _dateFilter: DateFilter<T>;

  @Output() selectedOptionChange = new EventEmitter<string>();

  @Input()
  public set dateRangeFilterConfig(value: Filter<T>) {
    this._dateFilter = value as DateFilter<T>;
    if (this._dateFilter.selectedOption) {
      if (/^\d+$/.test(this._dateFilter.selectedOption)) {
        let dateRangeIndex = parseInt(this._dateFilter.selectedOption);
        if (
          dateRangeIndex >= 0 &&
          dateRangeIndex < this._dateFilter.standardDateRanges.length
        ) {
          let selectedDateRange = calculateDateRange(
            this._dateFilter.standardDateRanges[dateRangeIndex]
          );
          this.fromDate = selectedDateRange.start;
          this.toDate = selectedDateRange.end;
          this.apply();
        }
      } else {
        const dates = this._dateFilter.selectedOption.split("_");
        if (dates.length == 2) {
          const firstDate = new Date(dates[0]);
          const secondDate = new Date(dates[1]);
          if (isValidDate(firstDate) && isValidDate(secondDate)) {
            this.fromDate = firstDate;
            this.toDate = secondDate;
            this.apply();
          }
        }
      }
    }
  }

  constructor(private dialog: MatDialog) {}

  apply() {
    this._dateFilter.filter = this.buildFilter();
    this.selectedOptionChange.emit(this._dateFilter.selectedOption);
  }

  dateChangedManually() {
    this._dateFilter.selectedOption =
      dateToString(this.fromDate) + "_" + dateToString(this.toDate);
    this.apply();
  }

  assignDateRangePanelResult(dRPR: DateRangePanelResult) {
    this.fromDate = dRPR.selectedRangeValue.start;
    this.toDate = dRPR.selectedRangeValue.end;
    this._dateFilter.selectedOption =
      dRPR.selectedIndexOfDateRanges ??
      dateToString(dRPR.selectedRangeValue.start) +
        "_" +
        dateToString(dRPR.selectedRangeValue.end);
    this.apply();
  }

  buildFilter(): DataFilter<T> {
    return {
      [this._dateFilter.name]: {
        $gte: moment(this.fromDate).format("YYYY-MM-DD"),
        $lte: moment(this.toDate).format("YYYY-MM-DD"),
      },
    } as DataFilter<T>;
  }

  openDialog(e: Event) {
    e.stopPropagation();
    this.dialog
      .open(DateRangeFilterPanelComponent, {
        width: "600px",
        minWidth: "400px",
        data: {
          fromDate: this.fromDate,
          toDate: this.toDate,
          standardDateRanges: this._dateFilter.standardDateRanges,
        },
      })
      .afterClosed()
      .subscribe((res: DateRangePanelResult) => {
        if (res) {
          this.assignDateRangePanelResult(res);
        }
      });
  }
}
