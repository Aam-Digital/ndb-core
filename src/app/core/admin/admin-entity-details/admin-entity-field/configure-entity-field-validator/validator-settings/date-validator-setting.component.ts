import { Component, computed, input, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { DynamicComponent } from "#src/app/core/config/dynamic-components/dynamic-component.decorator";
import { EditDateComponent } from "#src/app/core/basic-datatypes/date/edit-date/edit-date.component";
import { EditMonthComponent } from "#src/app/core/basic-datatypes/month/edit-month/edit-month.component";
import { MonthDatatype } from "#src/app/core/basic-datatypes/month/month.datatype";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
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
        <app-edit-month [formControl]="formControl()" />
      } @else {
        <app-edit-date [formControl]="formControl()" />
      }
    </mat-form-field>
  `,
})
export class DateValidatorSettingComponent
  implements OnInit, ValidatorSettingComponent<Date | string>
{
  readonly formControl = input.required<FormControl<Date | string | null>>();
  readonly label = input.required<string>();
  readonly field = input<EntitySchemaField>();

  protected readonly isMonth = computed(
    () => this.field()?.dataType === MonthDatatype.dataType,
  );

  ngOnInit() {
    // the config stores the date as a text, before it is bound to the date input
    const control = this.formControl();
    const value = control.value;
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        control.setValue(parsed, { emitEvent: false });
      }
    }
  }
}
