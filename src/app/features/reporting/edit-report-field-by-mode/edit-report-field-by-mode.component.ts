import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatFormFieldControl } from "@angular/material/form-field";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { Entity } from "#src/app/core/entity/model/entity";
import { JsonEditorComponent } from "#src/app/core/admin/json-editor/json-editor.component";

/**
 * Wraps the JSON editor for a report definition field and only shows it when the report's
 * current `mode` is one the field applies to (`formFieldConfig.additional.modes`); otherwise
 * a short "not applicable" note is shown. The `reportDefinition` is only used in "sql" mode,
 * `aggregationDefinitions` only in "reporting"/"exporting" mode.
 *
 * The mode is read live from the sibling `mode` form control, so switching the mode dropdown
 * immediately shows/hides the relevant editor. Interim until generic conditional form fields
 * (#3091) exist.
 */
@DynamicComponent("EditReportFieldByMode")
@Component({
  selector: "app-edit-report-field-by-mode",
  templateUrl: "./edit-report-field-by-mode.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, JsonEditorComponent],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditReportFieldByModeComponent,
    },
  ],
})
export class EditReportFieldByModeComponent
  extends CustomFormControlDirective<object>
  implements EditComponent, OnInit
{
  private readonly destroyRef = inject(DestroyRef);

  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  /** the report's current mode; an unset mode defaults to "reporting" (see ReportConfig) */
  private readonly mode = signal<string | undefined>(undefined);

  /** the report modes this field applies to, from its `additional.modes` config */
  private readonly applicableModes = computed<string[]>(
    () => this.formFieldConfig()?.additional?.modes ?? [],
  );

  /** whether the wrapped editor should be shown for the current mode */
  readonly applies = computed<boolean>(() => {
    const modes = this.applicableModes();
    return modes.length === 0 || modes.includes(this.mode() || "reporting");
  });

  ngOnInit() {
    const modeControl = this.formControl?.parent?.get("mode");
    if (modeControl) {
      this.mode.set(modeControl.value);
      modeControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((value) => this.mode.set(value));
    } else {
      this.mode.set((this.entity() as { mode?: string })?.mode);
    }
  }
}
