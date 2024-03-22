import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { DateRangeFilterPanelComponent } from "./date-range-filter-panel/date-range-filter-panel.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormsModule } from "@angular/forms";
import { dateToString, isValidDate } from "../../../../utils/utils";
import { DateFilter } from "../../../filter/filters/dateFilter";

@Component({
  selector: "app-date-range-filter",
  templateUrl: "./date-range-filter.component.html",
  styleUrls: ["./date-range-filter.component.scss"],
  standalone: true,
  imports: [MatFormFieldModule, MatDatepickerModule, FormsModule],
})
export class DateRangeFilterComponent<T extends Entity> implements OnChanges {
  fromDate: Date;
  toDate: Date;

  @Input() filterConfig: DateFilter<T>;

  constructor(private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.filterConfig) {
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
