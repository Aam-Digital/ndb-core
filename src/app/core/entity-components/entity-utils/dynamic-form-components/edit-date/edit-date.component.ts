import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { ErrorHintComponent } from "../../error-hint/error-hint.component";

@DynamicComponent("EditDate")
@Component({
  selector: "app-edit-date",
  templateUrl: "./edit-date.component.html",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    ErrorHintComponent,
  ],
  standalone: true,
})
export class EditDateComponent extends EditComponent<Date> {
  onInitFromDynamicConfig(config: EditPropertyConfig<Date>) {
    super.onInitFromDynamicConfig(config);
    if (
      config.propertySchema.additional?.startWithNow && // we should start with the current date
      config.entity._rev === undefined && // the entity is new (i.e. the revision is undefined)
      config.formControl.value === null // and the field has no value so far (might be overwritten in the entities class)
    ) {
      config.formControl.setValue(new Date());
    }
  }
}
