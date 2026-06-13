import { Entity } from "#src/app/core/entity/model/entity";
import {
  Component,
  computed,
  input,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CustomFormControlDirective } from "../../../common-components/basic-autocomplete/custom-form-control.directive";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component.interface";
import { DateWithAge } from "../dateWithAge";

@DynamicComponent("EditAge")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-edit-age",
  templateUrl: "./edit-age.component.html",
  styleUrls: [
    "../../../entity/entity-field-edit/dynamic-edit/dynamic-edit.component.scss",
    "./edit-age.component.scss",
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
  implements EditComponent, OnInit
{
  formFieldConfig = input<FormFieldConfig>();
  entity = input<Entity>();

  /** The age derived from the current date value, kept reactive via the base `valueSignal`. */
  readonly age = computed(() => this.valueSignal()?.age ?? null);

  override writeValue(newValue: DateWithAge | Date) {
    if (newValue instanceof Date && !(newValue instanceof DateWithAge)) {
      super.writeValue(new DateWithAge(newValue));
    } else {
      super.writeValue(newValue);
    }
  }

  ngOnInit() {
    // Ensure the stored value is always a DateWithAge (so `.age` is available).
    // In EditComponent mode the value flows through the control, not writeValue.
    this.formControl.valueChanges.subscribe((newValue) => {
      if (newValue instanceof Date && !(newValue instanceof DateWithAge)) {
        this.formControl.setValue(new DateWithAge(newValue));
      }
    });
  }
}
