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
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { reportUsesDateRange } from "../report-config";

type Transformations = { [key: string]: string[] };

/**
 * Read-only indicator of whether the report uses the selected report period (start & end date).
 *
 * This is derived automatically from the report's queries (SQL `$startDate`/`$endDate` or the
 * `?` placeholders of in-browser reports) rather than being toggled by hand — so it can never
 * get out of sync with the actual query. For SQL reports the derived `transformations` are still
 * written into the config, since the backend needs them to substitute the date parameters.
 */
@DynamicComponent("EditReportPeriodToggle")
@Component({
  selector: "app-edit-report-period-toggle",
  templateUrl: "./edit-report-period-toggle.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatSlideToggleModule, MatTooltipModule],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: EditReportPeriodToggleComponent,
    },
  ],
})
export class EditReportPeriodToggleComponent
  extends CustomFormControlDirective<Transformations>
  implements EditComponent, OnInit
{
  private readonly destroyRef = inject(DestroyRef);

  formFieldConfig = input<FormFieldConfig>();

  /** the report's mode and definition, read from the sibling form controls */
  private readonly mode = signal<string | undefined>(undefined);
  private readonly reportDefinition = signal<unknown>(undefined);

  /** whether the report's queries imply a date-range (start & end date) input */
  readonly usesDateRange = computed<boolean>(() =>
    reportUsesDateRange({
      mode: this.mode(),
      reportDefinition: this.reportDefinition(),
    }),
  );

  /** the canonical transformation object enabling the report period (start & end date) */
  static readonly REPORT_PERIOD_TRANSFORMATION: Transformations = {
    startDate: ["SQL_FROM_DATE"],
    endDate: ["SQL_TO_DATE"],
  };

  ngOnInit() {
    const parent = this.formControl?.parent;
    const modeControl = parent?.get("mode");
    const definitionControl = parent?.get("reportDefinition");

    this.mode.set(modeControl?.value);
    this.reportDefinition.set(definitionControl?.value);

    // React to the user editing the mode or the queries: recompute and keep the persisted
    // `transformations` in step with the query placeholders (SQL only).
    modeControl?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.mode.set(value);
        this.syncTransformations();
      });
    definitionControl?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.reportDefinition.set(value);
        this.syncTransformations();
      });
  }

  /**
   * For SQL reports, write the derived report-period `transformations` into the bound control
   * so the backend receives them. Non-period transformation keys are preserved; non-SQL modes
   * don't use `transformations` at all, so they are left untouched.
   */
  private syncTransformations(): void {
    if (this.mode() !== "sql") {
      return;
    }

    const { startDate, endDate, ...rest } = this.valueSignal() ?? {};
    const next: Transformations = this.usesDateRange()
      ? {
          ...rest,
          ...EditReportPeriodToggleComponent.REPORT_PERIOD_TRANSFORMATION,
        }
      : rest;

    if (JSON.stringify(this.valueSignal() ?? {}) === JSON.stringify(next)) {
      return;
    }
    this.formControl?.setValue(next);
    this.formControl?.markAsDirty();
  }
}
