import { Component, ElementRef, Input, Optional, Self } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgControl,
  NgForm,
  ReactiveFormsModule,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { MatInput } from "@angular/material/input";

@Component({
  selector: "app-range-input",
  standalone: true,
  imports: [MatInput, ReactiveFormsModule],
  templateUrl: "./range-input.component.html",
  styleUrl: "./range-input.component.scss",
  providers: [
    { provide: MatFormFieldControl, useExisting: RangeInputComponent },
  ],
})
export class RangeInputComponent extends CustomFormControlDirective<NumericRange> {
  formGroup: FormGroup = new FormGroup({
    from: new FormControl(),
    to: new FormControl(),
  });

  @Input() set value(value: NumericRange) {
    // update the internal formGroup when the value changes from the outside
    this.formGroup.setValue(value, { emitEvent: false });
    super.value = value;
  }
  get value(): NumericRange {
    return super.value;
  }

  constructor(
    elementRef: ElementRef<HTMLElement>,
    errorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() ngControl: NgControl,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,
  ) {
    super(
      elementRef,
      errorStateMatcher,
      ngControl,
      parentForm,
      parentFormGroup,
    );

    this.formGroup.valueChanges.subscribe((value) => {
      this.value = value;
      console.log("internal value changes", this.value);
    });
  }
}

export class NumericRange {
  constructor(
    public from: number,
    public to: number,
  ) {}
}
