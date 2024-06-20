import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { NumberFilter } from "app/core/filter/filters/numberFilter";
import { MatInput } from "@angular/material/input";

@Component({
  selector: "app-date-range-filter",
  templateUrl: "./number-range-filter.component.html",
  styleUrls: ["./number-range-filter.component.scss"],
  standalone: true,
  imports: [MatFormFieldModule, FormsModule, ReactiveFormsModule, MatInput],
})
export class NumberRangeFilterComponent<T extends Entity> implements OnChanges {
  @Input() filterConfig: NumberFilter<T>;

  fromValue: number;
  toValue: number;

  form: FormGroup;

  constructor() {
    this.form = new FormGroup({
      range: new FormControl(
        {
          minimum: 10,
          maximum: 100,
        },
        [
          Validators.required, //optional
          Validators.min(10), //optional
          Validators.max(100), //optional
        ],
      ),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
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
