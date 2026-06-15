import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";

@DynamicComponent("EditLongText")
@Component({
  selector: "app-edit-long-text",
  templateUrl: "./edit-long-text.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatInputModule, MatTooltipModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditLongTextComponent },
  ],
})
export class EditLongTextComponent
  extends CustomFormControlDirective<string>
  implements EditComponent
{
  formFieldConfig = input<FormFieldConfig>();
}
