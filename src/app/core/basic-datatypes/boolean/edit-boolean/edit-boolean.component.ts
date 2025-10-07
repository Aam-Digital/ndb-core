import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { BooleanInputComponent } from "./boolean-input/boolean-input.component";

@DynamicComponent("EditBoolean")
@Component({
  selector: "app-edit-boolean",
  templateUrl: "./edit-boolean.component.html",
  styleUrls: ["./edit-boolean.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, BooleanInputComponent],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditBooleanComponent },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class EditBooleanComponent
  extends CustomFormControlDirective<boolean>
  implements EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;

  get formControl(): FormControl<boolean> {
    return this.ngControl.control as FormControl<boolean>;
  }
}
