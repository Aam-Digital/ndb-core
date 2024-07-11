import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";
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
  debug($event: any) {
    console.log("debug", $event);
  }
  @Input() filterConfig: NumberFilter<T>;

  fromValue: number;
  toValue: number;
  range: NumericRange;

  formControl: FormControl<NumericRange>;

  // form: FormGroup;

  constructor(fb: FormBuilder) {
    this.formControl = fb.control(new NumericRange(1, 2), {
      validators: this.identicalValuesValidator,
    });
    this.formControl.valueChanges.subscribe((value) => {
      console.log("value changed in number filter", value);
      this.formControl.markAsTouched();
    });

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

  identicalValuesValidator: ValidatorFn = (
    control: AbstractControl<NumericRange>,
  ): ValidationErrors | null => {
    console.log("filter validator", control.value);

    const value: NumericRange = control.value;

    return value?.from && value?.to && value?.from === value?.to
      ? { identicalValues: true }
      : null;
  };

  ngOnChanges(changes: SimpleChanges): void {
    console.log("changes: range:", this.range);
    if (changes.filterConfig) {
      // this.initDates();
    }
  }

  clicked() {
    console.log("clicked; value:", this.formControl.value);
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
