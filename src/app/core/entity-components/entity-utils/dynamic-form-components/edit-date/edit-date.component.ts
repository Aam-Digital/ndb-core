import { Component } from "@angular/core";
import { EditComponent } from "../edit-component";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { ErrorHintComponent } from "../../error-hint/error-hint.component";
import { dateEntitySchemaDatatype } from "../../../../entity/schema-datatypes/datatype-date";

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
  protected initDefaultValue() {
    if (
      this.propertySchema.defaultValue ===
      dateEntitySchemaDatatype.PLACEHOLDERS.NOW
    ) {
      this.formControl.setValue(new Date());
    } else {
      super.initDefaultValue();
    }
  }
}
