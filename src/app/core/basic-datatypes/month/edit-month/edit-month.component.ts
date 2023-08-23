import { Component, ViewEncapsulation } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import {
  MatDatepicker,
  MatDatepickerModule,
} from "@angular/material/datepicker";
import { ReactiveFormsModule } from "@angular/forms";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
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
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    ErrorHintComponent,
  ],
  templateUrl: "./edit-month.component.html",
  styleUrls: ["./edit-month.component.scss"],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class EditMonthComponent extends EditComponent<Date> {
  setMonthAndYear(date: Moment, datepicker: MatDatepicker<Moment>) {
    this.formControl.setValue(date.toDate());
    this.formControl.markAsDirty();
    datepicker.close();
  }
}
