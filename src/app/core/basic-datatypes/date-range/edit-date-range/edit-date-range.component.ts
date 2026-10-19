import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { DateRangeValue } from "../date-range.datatype";

/** Validator for the value of the field: the end must not be before the start. */
export function endNotBeforeStart(
  control: AbstractControl<DateRangeValue | null>,
): ValidationErrors | null {
  const { start, end } = control.value ?? {};
  if (start && end && end < start) {
    return {
      dateRange: {
        errorMessage: $localize`The end date must not be before the start date.`,
      },
    };
  }
  return null;
}

/**
 * Form field to edit a {@link DateRangeValue}: the start and the end date in one range picker.
 */
@DynamicComponent("EditDateRange")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-edit-date-range",
  templateUrl: "./edit-date-range.component.html",
  styleUrls: [
    "../../../entity/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
  ],
  imports: [MatInputModule, ReactiveFormsModule, MatDatepickerModule],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditDateRangeComponent },
  ],
})
export class EditDateRangeComponent
  extends CustomFormControlDirective<DateRangeValue | null>
  implements EditComponent, OnInit
{
  formFieldConfig = input<FormFieldConfig>();

  private readonly destroyRef = inject(DestroyRef);

  /** the two inputs of the range picker, which are kept in sync with the form control of the field */
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  constructor() {
    super();
    effect(() => {
      if (this.enabled()) {
        this.range.enable({ emitEvent: false });
      } else {
        this.range.disable({ emitEvent: false });
      }
    });
  }

  ngOnInit() {
    this.formControl.addValidators(endNotBeforeStart);
    this.formControl.updateValueAndValidity({ emitEvent: false });

    this.showValue(this.formControl.value);
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.showValue(value));
    this.range.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ start, end }) => {
        this.formControl.setValue(
          start || end
            ? { ...(start && { start }), ...(end && { end }) }
            : null,
        );
        this.formControl.markAsDirty();
      });
  }

  /** Show a value that was set from outside, without resetting what the user is just typing. */
  private showValue(value: DateRangeValue | null | undefined) {
    const { start, end } = this.range.value;
    if (isSameDate(start, value?.start) && isSameDate(end, value?.end)) {
      return;
    }
    this.range.setValue(
      { start: value?.start ?? null, end: value?.end ?? null },
      { emitEvent: false },
    );
  }
}

function isSameDate(a?: Date | null, b?: Date | null): boolean {
  return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}
