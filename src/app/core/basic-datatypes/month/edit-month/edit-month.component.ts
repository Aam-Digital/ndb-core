import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
} from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import {
  MatDatepicker,
  MatDatepickerModule,
} from "@angular/material/datepicker";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from "@angular/material/core";
import { Moment } from "moment";
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from "@angular/material-moment-adapter";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { MatFormFieldControl } from "@angular/material/form-field";
import { EditComponent } from "../../../common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";

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
    "../../../common-components/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
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
