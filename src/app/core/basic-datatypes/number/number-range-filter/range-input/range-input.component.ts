import { Component, ElementRef, Input, Optional, Self } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  NgControl,
  NgForm,
  ReactiveFormsModule,
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "app/core/common-components/basic-autocomplete/custom-form-control.directive";

class Range {
  constructor(
    public from: number,
    public to: number,
  ) {}
}

@Component({
  selector: "app-range-input",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./range-input.component.html",
  styleUrl: "./range-input.component.scss",
  providers: [
    { provide: MatFormFieldControl, useExisting: RangeInputComponent },
  ],
})
export class RangeInputComponent extends CustomFormControlDirective<Range> {
  parts: FormGroup;

  @Input()
  get value(): Range | null {
    let n = this.parts.value;
    if (typeof n.from !== undefined || n.to !== undefined) {
      return new Range(n.from, n.to);
    }
    return null;
  }
  set value(range: Range | null) {
    this.parts.setValue({ from: range?.from ?? null, to: range?.to ?? null });
  }

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

    this.parts = fb.group({
      from: "",
      to: "",
    });
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != "input") {
      this.elementRef.nativeElement.querySelector("input").focus();
    }
  }
}
