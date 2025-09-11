import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { CustomNumberValidators } from "../../../../utils/custom-number-validators";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { MatFormFieldControl } from "@angular/material/form-field";

@DynamicComponent("EditNumber")
@Component({
  selector: "app-edit-number",
  templateUrl: "./edit-number.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatInputModule, MatTooltipModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditNumberComponent },
  ],
})
export class EditNumberComponent
  extends CustomFormControlDirective<number>
  implements OnInit
{
  get formControl(): FormControl<number> {
    return this.ngControl.control as FormControl<number>;
  }

  ngOnInit() {
    const newValidators = [CustomNumberValidators.isNumber];
    if (this.formControl.validator) {
      newValidators.push(this.formControl.validator);
    }
    this.formControl.setValidators(newValidators);
    this.formControl.updateValueAndValidity();
  }
}
