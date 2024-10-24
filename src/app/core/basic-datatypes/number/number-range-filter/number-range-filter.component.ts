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
  from: number;
  to: number;

  ngOnInit() {
    this.formControl = new FormControl<NumericRange>({
      from: Number(this.filterConfig.selectedOptionValues[0]),
      to: Number(this.filterConfig.selectedOptionValues[1]),
    });
    this.formControl.valueChanges.subscribe((value) => {
      this.filterConfig.selectedOptionValues = [
        this.formControl.value.from?.toString() ?? "",
        this.formControl.value.to?.toString() ?? "",
      ];

      this.filterConfig.selectedOptionChange.emit(
        this.filterConfig.selectedOptionValues,
      );
    });
  }
}
