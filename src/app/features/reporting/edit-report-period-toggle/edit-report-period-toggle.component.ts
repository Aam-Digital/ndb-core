import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";

type Transformations = { [key: string]: string[] };

/**
 * Friendly editor for a SQL report's `transformations`: a single toggle controlling whether
 * the report uses the selected report period (start & end date) as query parameters.
 *
 * For now this only exposes the common date-range transformation; advanced/custom
 * transformations are not editable here.
 */
@DynamicComponent("EditReportPeriodToggle")
@Component({
  selector: "app-edit-report-period-toggle",
  templateUrl: "./edit-report-period-toggle.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatSlideToggleModule],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditReportPeriodToggleComponent,
    },
  ],
})
export class EditReportPeriodToggleComponent
  extends CustomFormControlDirective<Transformations>
  implements EditComponent
{
  formFieldConfig = input<FormFieldConfig>();

  /** the canonical transformation object enabling the report period (start & end date) */
  static readonly REPORT_PERIOD_TRANSFORMATION: Transformations = {
    startDate: ["SQL_FROM_DATE"],
    endDate: ["SQL_TO_DATE"],
  };

  /** the toggle is "on" when the report-period (start & end date) transformation is present */
  readonly checked = computed<boolean>(() => {
    const value = this.valueSignal();
    return !!value?.["startDate"] || !!value?.["endDate"];
  });

  setChecked(checked: boolean) {
    // Preserve any other (non-period) transformation keys; only add/remove startDate & endDate.
    const { startDate, endDate, ...rest } = this.valueSignal() ?? {};
    const value: Transformations = checked
      ? {
          ...rest,
          ...EditReportPeriodToggleComponent.REPORT_PERIOD_TRANSFORMATION,
        }
      : rest;

    // Write through the bound FormControl directly: unlike editors that bind an inner
    // `[formControl]`, this toggle has no inner control accessor, so the directive's
    // `onChange` is never registered and `this.value = …` would not reach the form.
    this.formControl?.setValue(value);
    this.formControl?.markAsDirty();
  }
}
