import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from "@angular/material-moment-adapter";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from "@angular/material/core";
import {
  MatDatepicker,
  MatDatepickerModule,
} from "@angular/material/datepicker";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Moment } from "moment";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";

export const MY_FORMATS = {
  parse: {
    dateInput: "YYYY-MM",
  },
  display: {
    dateInput: "YYYY-MM",
    monthYearLabel: "YYYY MMM",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "YYYY MMMM",
  },
};

@Component({
  selector: "app-edit-month",
  imports: [
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    FontAwesomeModule,
  ],
  templateUrl: "./edit-month.component.html",
  styleUrls: [
    "./edit-month.component.scss",
    "../../../entity/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MatFormFieldControl, useExisting: EditMonthComponent },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class EditMonthComponent
  extends CustomFormControlDirective<Date>
  implements EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;

  get formControl(): FormControl<Date> {
    return this.ngControl.control as FormControl<Date>;
  }

  setMonthAndYear(date: Moment, datepicker: MatDatepicker<Moment>) {
    this.formControl.markAsDirty();
    this.formControl.setValue(date.toDate());
    datepicker.close();
  }
}
