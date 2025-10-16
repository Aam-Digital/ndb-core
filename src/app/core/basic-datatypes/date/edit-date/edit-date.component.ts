import { CustomFormControlDirective } from "#src/app/core/common-components/basic-autocomplete/custom-form-control.directive";
import { Component, Input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";

@DynamicComponent("EditDate")
@Component({
  selector: "app-edit-date",
  templateUrl: "./edit-date.component.html",
  styleUrls: [
    "../../../entity/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
  ],
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    FontAwesomeModule,
  ],
  providers: [{ provide: MatFormFieldControl, useExisting: EditDateComponent }],
})
export class EditDateComponent
  extends CustomFormControlDirective<Date>
  implements EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;

  get formControl(): FormControl<Date> {
    return this.ngControl.control as FormControl<Date>;
  }
}
