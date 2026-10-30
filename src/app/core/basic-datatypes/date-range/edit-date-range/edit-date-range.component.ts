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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from "@angular/forms";
import { DateRange, MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import moment from "moment";
import { startWith } from "rxjs";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { Entity } from "../../../entity/model/entity";
import { EMPTY_FILTER_OPTION_KEY } from "../../../filter/filters/filters";
import { DateRangeFilterPanelComponent } from "../../date/date-range-filter/date-range-filter-panel/date-range-filter-panel.component";
import {
  calculateDateRange,
  periodRangeOptions,
} from "../../date/date-range-filter/date-range-filter-panel/date-range-utils";
import { DateRangeFilterConfigOption } from "../../../entity-list/EntityListConfig";
import { DateRangeValue } from "../date-range.datatype";
import { findParentOutside, parentRangesResource } from "../parent-ranges";

/**
 * Form field to edit a {@link DateRangeValue}: the start and the end date in one range picker.
 * With the `withinParent` validator, a warning icon shows in view mode when the range goes beyond a linked parent's range
 * (while editing, the validator's error shows below the field instead).
 */
@DynamicComponent("EditDateRange")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-edit-date-range",
  templateUrl: "./edit-date-range.component.html",
  styleUrls: [
    "../../../entity/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
    "./edit-date-range.component.scss",
  ],
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    FaDynamicIconComponent,
    MatTooltipModule,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: EditDateRangeComponent },
  ],
})
export class EditDateRangeComponent
  extends CustomFormControlDirective<DateRangeValue | null>
  implements EditComponent, OnInit
{
  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  /**
   * The predefined ranges offered next to the calendar: the periods of the linked parent records (see `withinParent`),
   * then the ones in the `additional` config of the field (an empty list offers none), or the default ones.
   */
  readonly rangeOptions = computed<DateRangeFilterConfigOption[]>(() => {
    const configured = this.formFieldConfig()?.additional;
    return [
      ...this.closedParentPeriods().map(({ name, range }) =>
        fixedRangeOption($localize`Period of ${name}`, range),
      ),
      ...(Array.isArray(configured) ? configured : periodRangeOptions),
    ];
  });

  /**
   * The linked parent periods with a start and an end
   * (a predefined range always has an end, so an ongoing period cannot be one).
   */
  private readonly closedParentPeriods = computed(() =>
    (this.parents.value() ?? []).filter(
      ({ range }) => range?.start && range?.end,
    ),
  );

  /** shaded in the calendar: the period of the (first) parent */
  private readonly highlightedParentRange = computed(() => {
    const range = this.closedParentPeriods()[0]?.range;
    return range && new DateRange(range.start, range.end);
  });

  /**
   * the parent link as entered in the form, if the form has that field (otherwise the record's saved link is used),
   * so that the parent's period offered and shaded while editing follows a changed link before it is saved
   */
  private readonly parentReferenceInForm = signal<
    { value: string | string[] | null } | undefined
  >(undefined);

  private readonly parents = parentRangesResource(() => {
    const field = this.formFieldConfig();
    const config = field?.validators?.withinParent;
    if (!config || this.entity()?.anonymized) {
      return undefined;
    }
    const inForm = this.parentReferenceInForm();
    return {
      parentReference: inForm
        ? inForm.value
        : this.entity()?.[config.parentReferenceField],
      config,
      fieldId: field.id,
    };
  });

  /** name of the first linked parent record whose range the entered range goes beyond */
  protected readonly outsideParent = computed(() =>
    findParentOutside(this.valueSignal(), this.parents.value()),
  );

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

  /**
   * A text that cannot be read as a date stays as an error of its own input in the picker and is not part of the value,
   * so the field would be valid and the text would be lost when saving.
   */
  private readonly pickerInputsReadable = (): ValidationErrors | null =>
    this.range.controls.start.hasError("matDatepickerParse") ||
    this.range.controls.end.hasError("matDatepickerParse")
      ? {
          dateRangeInput: {
            errorMessage: $localize`Please enter a valid date.`,
          },
        }
      : null;

  ngOnInit() {
    this.formControl.addValidators(this.pickerInputsReadable);
    this.formControl.updateValueAndValidity({ emitEvent: false });
    // it checks the inputs of this component, so it must not stay on the field once the component is gone
    this.destroyRef.onDestroy(() => {
      this.formControl.removeValidators(this.pickerInputsReadable);
      this.formControl.updateValueAndValidity({ emitEvent: false });
    });

    this.formControl.valueChanges
      .pipe(
        startWith(this.formControl.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.showValue(value));
    this.followParentReferenceInForm();
    this.range.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formControl.updateValueAndValidity());
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

  private followParentReferenceInForm() {
    const field =
      this.formFieldConfig()?.validators?.withinParent?.parentReferenceField;
    const control = field && this.formControl.parent?.get(field);
    if (!control) {
      return;
    }
    this.parentReferenceInForm.set({ value: control.value });
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.parentReferenceInForm.set({ value }));
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

  /**
   * Pick the dates in the calendar or as one of the predefined ranges
   * (the same panel as the date filters of lists and reports).
   */
  openPanel(event: Event) {
    event.stopPropagation();
    // the click also reaches the disabled toggle, e.g. next to its button
    if (!this.enabled()) {
      return;
    }

    const { start, end } = this.range.value;
    // the panel returns an index into these, which must not shift if the parent's period loads in the meantime
    const rangeOptions = this.rangeOptions();
    this.dialog
      .open(DateRangeFilterPanelComponent, {
        width: "600px",
        minWidth: "400px",
        data: {
          dateRange: new DateRange(start ?? null, end ?? null),
          rangeOptions,
          hideAllOption: true,
          highlightRange: this.highlightedParentRange(),
        },
      })
      .afterClosed()
      .subscribe((result?: { selectedOptionValues: string[] }) => {
        if (result?.selectedOptionValues?.length) {
          this.range.setValue(
            this.toDates(result.selectedOptionValues, rangeOptions),
          );
        }
      });
  }

  /** The dates of a selection in the panel: "no date", the index of a predefined range, or two picked dates. */
  private toDates(
    [first, second]: string[],
    rangeOptions: DateRangeFilterConfigOption[],
  ): {
    start: Date | null;
    end: Date | null;
  } {
    if (first === EMPTY_FILTER_OPTION_KEY) {
      return { start: null, end: null };
    }
    if (second === undefined) {
      const range = calculateDateRange(rangeOptions[Number(first)]);
      return { start: startOfDay(range.start), end: startOfDay(range.end) };
    }
    return { start: fromDateString(first), end: fromDateString(second) };
  }
}

/** a predefined range for the given dates (the options are offsets from today) */
function fixedRangeOption(
  label: string,
  range: DateRangeValue,
): DateRangeFilterConfigOption {
  const today = moment().startOf("day");
  const daysFromToday = (date: Date) =>
    moment(date).startOf("day").diff(today, "days");
  return {
    label,
    startOffsets: [{ amount: daysFromToday(range.start), unit: "days" }],
    endOffsets: [{ amount: daysFromToday(range.end), unit: "days" }],
  };
}

function startOfDay(date: Date): Date {
  return moment(date).startOf("day").toDate();
}

/** a date as "YYYY-MM-DD" (as the panel returns the picked dates), in local time */
function fromDateString(value: string): Date {
  return moment(value, "YYYY-MM-DD").toDate();
}

function isSameDate(a?: Date | null, b?: Date | null): boolean {
  return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}
