import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponentDirective } from "#src/app/core/config/dynamic-components/dynamic-component.directive";
import { Entity } from "#src/app/core/entity/model/entity";
import { Component, Input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { EditComponent } from "./edit-component.interface";

@Component({
  selector: "app-dynamic-edit",
  imports: [DynamicComponentDirective, ReactiveFormsModule],
  templateUrl: "./dynamic-edit.component.html",
  styleUrl: "./dynamic-edit.component.scss",
  providers: [
    { provide: MatFormFieldControl, useExisting: DynamicEditComponent },
  ],
})
export class DynamicEditComponent
  extends CustomFormControlDirective<any>
  implements EditComponent
{
  private static readonly TODO_COMPLETION_EDIT_COMPONENT = "EditTodoCompletion";

  @Input() formFieldConfig: FormFieldConfig;
  @Input() entity: Entity;

  override get disabled(): boolean {
    const control = this.ngControl?.control as FormControl<unknown> | null;

    // Keep Todo "Complete Task" button interactive in readonly forms while unfinished.
    if (
      this.formFieldConfig?.editComponent ===
        DynamicEditComponent.TODO_COMPLETION_EDIT_COMPONENT &&
      control?.disabled &&
      !control.value
    ) {
      return false;
    }

    return super.disabled;
  }

  override set disabled(value: boolean) {
    super.disabled = value;
  }
}
