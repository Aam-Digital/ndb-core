import { Component, ElementRef, Input, Optional, Self } from "@angular/core";
import {
  FormControl,
  FormControlDirective,
  FormGroup,
  FormGroupDirective,
  NgControl,
  NgForm,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
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

  @Input() override set value(value: NumericRange) {
    // update the internal formGroup when the value changes from the outside
    this.formGroup.setValue(value, { emitEvent: false });
    super.value = value;
  }
  override get value(): NumericRange {
    return super.value;
  }

  /**
   * Validation (activated by default) ensures the component has a sensible range
   * (e.g. "from" <= "to")
   * or otherwise marks the formControl invalid
   */
  @Input() activateValidation: boolean = true;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    errorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() ngControl: NgControl,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,
    @Optional() private formControlDirective: FormControlDirective,
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
    });
  }

  private validatorFunction: ValidatorFn = (): ValidationErrors | null => {
    if (
      this.value.from != undefined &&
      this.value.to != undefined &&
      this.value.from > this.value.to
    ) {
      return {
        fromGreaterThanTo: "The 'from' value is greater than the 'to' value.",
      };
    } else {
      return null;
    }
  };

  ngAfterViewInit() {
    if (this.activateValidation) {
      this.formControlDirective.form.addValidators([this.validatorFunction]);
    }
  }
}

export class NumericRange {
  constructor(
    public from: number,
    public to: number,
  ) {}
}
