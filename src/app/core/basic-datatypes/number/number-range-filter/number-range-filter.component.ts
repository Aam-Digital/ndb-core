import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";
import { NumberFilter } from "app/core/filter/filters/numberFilter";
import {
  NumericRange,
  RangeInputComponent,
} from "./range-input/range-input.component";

@Component({
  selector: "app-date-range-filter",
  templateUrl: "./number-range-filter.component.html",
  styleUrls: ["./number-range-filter.component.scss"],
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, RangeInputComponent],
})
export class NumberRangeFilterComponent<T extends Entity> implements OnChanges {
  @Input() filterConfig: NumberFilter<T>;

  fromValue: number;
  toValue: number;
  range: NumericRange;

  // form: FormGroup;

  constructor() {
    this.range = new NumericRange(1, 2);
    // this.form = new FormGroup({
    //   range: new FormControl(
    //     {
    //       minimum: 10,
    //       maximum: 100,
    //     },
    //     [
    //       Validators.required, //optional
    //       Validators.min(10), //optional
    //       Validators.max(100), //optional
    //     ],
    //   ),
    // });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log("changes: range:", this.range);
    if (changes.filterConfig) {
      // this.initDates();
    }
  }

  onNumericRangeChanged(value: any): void {
    console.log("Changed value: ", value);
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

type INumericRange = {
  minimum: number;
  maximum: number;
};
