import { Component } from "@angular/core";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";

@DynamicComponent("EditDate")
@Component({
  selector: "app-edit-date",
  templateUrl: "./edit-date.component.html",
  styleUrls: [
    "../../../common-components/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
  ],
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    FontAwesomeModule,
  ],
  providers: [{ provide: MatFormFieldControl, useExisting: EditDateComponent }],
})
export class EditDateComponent extends CustomFormControlDirective<Date> {
  get formControl(): FormControl<Date> {
    return this.ngControl.control as FormControl<Date>;
  }
}
