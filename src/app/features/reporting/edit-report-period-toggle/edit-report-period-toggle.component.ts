import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
 *
 * The report period is a SQL-only concept, so the whole field is hidden for other modes.
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
  implements EditComponent, OnInit
{
  private readonly destroyRef = inject(DestroyRef);

  formFieldConfig = input<FormFieldConfig>();

  /** the report's mode; the report period only applies to "sql" reports */
  private readonly mode = signal<string | undefined>(undefined);
  readonly isSql = computed<boolean>(() => this.mode() === "sql");

  /** the wrapping form-field row, hidden entirely for non-SQL modes */
  private readonly fieldRow = signal<HTMLElement | null>(null);

  /** the canonical transformation object enabling the report period (start & end date) */
  static readonly REPORT_PERIOD_TRANSFORMATION: Transformations = {
    startDate: ["SQL_FROM_DATE"],
    endDate: ["SQL_TO_DATE"],
  };

  constructor() {
    super();

    // Hide the whole field row (label + toggle + help) for non-SQL modes. Interim workaround
    // until generic conditional (mode-dependent) form fields exist; `.hidden` belongs to the
    // entity-field-edit wrapper's own stylesheet, so toggling it on that ancestor applies its
    // `display: none`.
    effect(() => {
      this.fieldRow()?.classList.toggle("hidden", !this.isSql());
    });
  }

  ngOnInit() {
    this.fieldRow.set(
      this.elementRef.nativeElement.closest(".flex-row") ?? null,
    );

    // Track the report's mode from the sibling form control.
    const modeControl = this.formControl?.parent?.get("mode");
    if (modeControl) {
      this.mode.set(modeControl.value);
      modeControl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((value) => this.mode.set(value));
    }
  }

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
