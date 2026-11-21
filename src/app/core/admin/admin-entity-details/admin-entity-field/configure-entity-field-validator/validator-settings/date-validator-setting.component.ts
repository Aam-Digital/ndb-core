import { Component, computed, effect, input, untracked } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditDateComponent } from "#src/app/core/basic-datatypes/date/edit-date/edit-date.component";
import { EditMonthComponent } from "#src/app/core/basic-datatypes/month/edit-month/edit-month.component";
import { MonthDatatype } from "#src/app/core/basic-datatypes/month/month.datatype";
import { parseToDate } from "#src/app/core/basic-datatypes/date/date-limit";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { dateToString } from "#src/app/utils/utils";
import { ValidatorSettingComponent } from "./validator-setting";

/** Setting of a validation rule that is a date (the limits of a date field), or a month for a month field. */
@DynamicComponent("DateValidatorSetting")
@Component({
  selector: "app-date-validator-setting",
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    EditDateComponent,
    EditMonthComponent,
  ],
  template: `
    <mat-form-field floatLabel="always">
      <mat-label>{{ label() }}</mat-label>
      @if (isMonth()) {
        <app-edit-month [formControl]="date" />
      } @else {
        <app-edit-date [formControl]="date" />
      }
    </mat-form-field>
  `,
})
export class DateValidatorSettingComponent implements ValidatorSettingComponent<
  Date | string
> {
  readonly formControl = input.required<FormControl<Date | string | null>>();
  readonly label = input.required<string>();
  readonly field = input<EntitySchemaField>();

  protected readonly isMonth = computed(
    () => this.field()?.dataType === MonthDatatype.dataType,
  );

  /**
   * The date inputs edit a Date, but the config stores the day as a text ("2020-03-01", or "$now" for today).
   * The text of a limit stays as it is until the date is changed, and is then stored without a time zone.
   */
  protected readonly date = new FormControl<Date | null>(null);

  constructor() {
    effect((onCleanup) => {
      const control = this.formControl();
      untracked(() =>
        this.date.setValue(parseToDate(control.value) ?? null, {
          emitEvent: false,
        }),
      );
      const sub = this.date.valueChanges.subscribe((value) => {
        control.setValue(value ? dateToString(value) : null);
        control.markAsDirty();
      });
      onCleanup(() => sub.unsubscribe());
    });
  }
}
