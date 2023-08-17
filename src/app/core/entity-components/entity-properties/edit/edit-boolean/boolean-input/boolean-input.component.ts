import {
  Component,
  ElementRef,
  Optional,
  Self,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { CustomFormControlDirective } from "../../../../../configurable-enum/basic-autocomplete/custom-form-control.directive";
import { MatCheckbox, MatCheckboxModule } from "@angular/material/checkbox";
import {
  FormGroupDirective,
  FormsModule,
  NgControl,
  NgForm,
} from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { ErrorStateMatcher } from "@angular/material/core";

@Component({
  selector: "app-boolean-input",
  standalone: true,
  imports: [MatCheckboxModule, FormsModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: BooleanInputComponent },
  ],
  templateUrl: "./boolean-input.component.html",
  styleUrls: ["./boolean-input.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class BooleanInputComponent extends CustomFormControlDirective<boolean> {
  @ViewChild(MatCheckbox, { static: true }) inputElement: MatCheckbox;

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
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() != "mat-checkbox") {
      this.inputElement.focus();
    }
  }
}
