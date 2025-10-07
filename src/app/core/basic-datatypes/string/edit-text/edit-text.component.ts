import { Component, ChangeDetectionStrategy, Input } from "@angular/core";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EditComponent } from "../../../common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";

@DynamicComponent("EditText")
@Component({
  selector: "app-edit-text",
  templateUrl: "./edit-text.component.html",
  styleUrls: ["./edit-text.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatInputModule, FormsModule, ReactiveFormsModule],
  providers: [{ provide: MatFormFieldControl, useExisting: EditTextComponent }],
})
export class EditTextComponent
  extends CustomFormControlDirective<string>
  implements EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;

  get formControl(): FormControl<string> {
    return this.ngControl.control as FormControl<string>;
  }
}
