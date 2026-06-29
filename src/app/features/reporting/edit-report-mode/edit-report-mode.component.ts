import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { BasicAutocompleteComponent } from "#src/app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";

/**
 * Edit a report's `mode` as a simple dropdown of the supported modes
 * ("reporting", "exporting", "sql").
 */
@DynamicComponent("EditReportMode")
@Component({
  selector: "app-edit-report-mode",
  templateUrl: "./edit-report-mode.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, BasicAutocompleteComponent],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditReportModeComponent },
  ],
})
export class EditReportModeComponent
  extends CustomFormControlDirective<string>
  implements EditComponent
{
  formFieldConfig = input<FormFieldConfig>();

  readonly modeOptions: string[] = ["reporting", "exporting", "sql"];
  readonly modeToString = (mode: string): string => mode;
}
