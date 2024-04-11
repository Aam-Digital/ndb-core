import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { DateFilter } from "../../../filter/filters/dateFilter";

@Component({
  selector: "app-date-range-filter",
  templateUrl: "./number-range-filter.component.html",
  styleUrls: ["./number-range-filter.component.scss"],
  standalone: true,
  imports: [MatFormFieldModule, FormsModule],
})
export class NumberRangeFilterComponent<T extends Entity> implements OnChanges {
  fromValue: number;
  toValue: number;

  // @Input() filterConfig: NumberFilter<T>;

  constructor(private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.filterConfig) {
      // this.initDates();
    }
  }

  // private initDates() {
  //   const range = this.filterConfig.getDateRange();
  //   if (
  //     (range.start !== this.fromDate || range.start === undefined) &&
  //     (range.end !== this.toDate || range.end === undefined)
  //   ) {
  //     this.fromDate = range.start;
  //     this.toDate = range.end;
  //     this.filterConfig.selectedOptionChange.emit(
  //       this.filterConfig.selectedOptionValues,
  //     );
  //   }
  // }

  numberChangedManually() {
    // this.filterConfig.selectedOptionValues = [
    //   isValidDate(this.fromDate) ? dateToString(this.fromDate) : "",
    //   isValidDate(this.toDate) ? dateToString(this.toDate) : "",
    // ];
    // this.filterConfig.selectedOptionChange.emit(
    //   this.filterConfig.selectedOptionValues,
    // );
  }

  // openDialog(e: Event) {
  //   e.stopPropagation();
  //   this.dialog
  //     .open(DateRangeFilterPanelComponent, {
  //       width: "600px",
  //       minWidth: "400px",
  //       data: this.filterConfig,
  //     })
  //     .afterClosed()
  //     .subscribe(() => this.initDates());
  // }
}
