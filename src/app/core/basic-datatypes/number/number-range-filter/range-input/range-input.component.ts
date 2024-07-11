import { Component, ElementRef, Input, Optional, Self } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  NgControl,
  NgForm,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import {
  MatFormFieldControl,
  MatFormFieldModule,
} from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { ErrorHintComponent } from "app/core/common-components/error-hint/error-hint.component";

@Component({
  selector: "app-range-input",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ErrorHintComponent,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: "./range-input.component.html",
  styleUrl: "./range-input.component.scss",
  providers: [
    { provide: MatFormFieldControl, useExisting: RangeInputComponent },
  ],
})
export class RangeInputComponent extends CustomFormControlDirective<NumericRange> {
  formGroup: FormGroup;

  /*
  @Input()
  get value(): NumericRange | null {
    let n = this.formGroup.value;
    if (typeof n.from !== undefined || n.to !== undefined) {
      return new NumericRange(n.from, n.to);
    }
    return null;
  }
  set value(range: NumericRange | null) {
    this.formGroup.setValue({
      from: range?.from ?? null,
      to: range?.to ?? null,
    });
    this.stateChanges.next();
  }
    */

  constructor(
    elementRef: ElementRef<HTMLElement>,
    errorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() ngControl: NgControl,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,
    fb: FormBuilder,
  ) {
    super(
      elementRef,
      errorStateMatcher,
      ngControl,
      parentForm,
      parentFormGroup,
    );
    /*
    this.formGroup = fb.group({
      from: [""],
      to: [""],
    });
    this.formGroup.valueChanges.subscribe(() => {
      console.log(
        "internal range formGroup value changed",
        this.formGroup.value,
      );
      this.value = this.formGroup.value;
    });*/
  }
  /*
  identicalValuesValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const from = control.get("from");
    const to = control.get("to");

    return from && to && from.value === to.value
      ? { identicalValues: true }
      : null;
  };

  onContainerClick(event: MouseEvent) {
    console.log(
      "container click; from:",
      this.formGroup.value.from,
      "; to: ",
      this.formGroup.value.to,
    );
    console.log("valid:", this.formGroup.valid);
    console.log("errors:", this.formGroup.errors);
    this.errorState = true;
    if ((event.target as Element).tagName.toLowerCase() != "input") {
      this.elementRef.nativeElement.querySelector("input").focus();
    }
  }*/
  onContainerClick(event: MouseEvent) {
    this.value = { from: 0, to: 0 };
  }
}

export class NumericRange {
  constructor(
    public from: number,
    public to: number,
  ) {}
}
