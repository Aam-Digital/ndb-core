import { Component, Input } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  NumericRange,
  RangeInputComponent,
} from "./range-input/range-input.component";
import { NumberFilter } from "../../../filter/filters/numberFilter";

@Component({
  selector: "app-date-range-filter",
  templateUrl: "./number-range-filter.component.html",
  styleUrls: ["./number-range-filter.component.scss"],
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, RangeInputComponent],
})
export class NumberRangeFilterComponent<T extends Entity> {
  @Input() filterConfig: NumberFilter<T>;

  formControl: FormControl<NumericRange>;

  constructor() {
    this.formControl = new FormControl<NumericRange>({ from: 0, to: 1 });

    this.formControl.valueChanges.subscribe((value) => {
      console.log("external value changes", value);
    });
  }
}
