import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomNumberValidators } from "../../../../utils/custom-number-validators";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";

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
  implements OnInit, EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;

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
