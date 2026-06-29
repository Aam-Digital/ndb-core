import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { JsonEditorComponent } from "../json-editor.component";

/**
 * Edit a field's value as raw JSON, using the shared {@link JsonEditorComponent}
 * as a form-field edit component.
 *
 * Reuses the existing vanilla-jsoneditor wrapper (including its tree-mode fallback for
 * very long strings, see #3821) by binding it through the standard `[formControl]`.
 */
@DynamicComponent("EditJson")
@Component({
  selector: "app-edit-json",
  templateUrl: "./edit-json.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, JsonEditorComponent],
  providers: [{ provide: MatFormFieldControl, useExisting: EditJsonComponent }],
})
export class EditJsonComponent
  extends CustomFormControlDirective<object>
  implements EditComponent
{
  formFieldConfig = input<FormFieldConfig>();
}
