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
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormsModule } from "@angular/forms";

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
      let dateRangeIndex = parseInt(this._dateFilter.selectedOption);
      if (
        dateRangeIndex >= 0 &&
        dateRangeIndex < this._dateFilter.standardDateRanges.length
      ) {
        let selectedDateRange = calculateDateRange(
          this._dateFilter.standardDateRanges[dateRangeIndex]
        );
        this.apply({
          selectedRangeValue: selectedDateRange,
          selectedIndexOfDateRanges: this._dateFilter.selectedOption,
        });
      }
    }
  }

  constructor(private dialog: MatDialog) {}

  apply(res?: DateRangePanelResult) {
    if (res) {
      this.fromDate = res.selectedRangeValue.start;
      this.toDate = res.selectedRangeValue.end;
    }
    this._dateFilter.filter = this.buildFilter();
    console.log(
      "apply this._dateFilter.selectedOption",
      this._dateFilter.selectedOption
    );
    this._dateFilter.selectedOption = res.selectedIndexOfDateRanges;
    this.selectedOptionChange.emit(this._dateFilter.selectedOption);
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
          this.apply(res);
        }
      });
  }
}
