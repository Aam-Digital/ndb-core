import { Entity } from "#src/app/core/entity/model/entity";
import { Component, Input, signal } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { EditComponent } from "../../../common-components/entity-field-edit/dynamic-edit/edit-component.interface";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { DateWithAge } from "../dateWithAge";

@DynamicComponent("EditAge")
@Component({
  selector: "app-edit-age",
  templateUrl: "./edit-age.component.html",
  styleUrls: [
    "../../../common-components/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
  ],
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatDatepickerModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  providers: [{ provide: MatFormFieldControl, useExisting: EditAgeComponent }],
})
export class EditAgeComponent
  extends CustomFormControlDirective<DateWithAge>
  implements EditComponent
{
  @Input() formFieldConfig?: FormFieldConfig;
  @Input() entity?: Entity;

  age = signal<number | null>(null);

  override writeValue(newValue: DateWithAge | Date) {
    if (newValue instanceof Date) {
      super.writeValue(new DateWithAge(newValue));
    } else {
      super.writeValue(newValue);
    }

    this.age.set(this.value?.age ?? null);
  }

  get formControl(): FormControl<DateWithAge> {
    return this.ngControl.control as FormControl<DateWithAge>;
  }
}
