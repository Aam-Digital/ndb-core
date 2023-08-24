import { Component } from "@angular/core";
import { EditComponent } from "../../../entity/default-datatype/edit-component";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import {
  MatDatepickerInputEvent,
  MatDatepickerModule,
} from "@angular/material/datepicker";
import { DateWithAge } from "../../../../child-dev-project/children/model/dateWithAge";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorHintComponent } from "../../../common-components/error-hint/error-hint.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgIf } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";

@DynamicComponent("EditAge")
@Component({
  selector: "app-edit-age",
  templateUrl: "./edit-age.component.html",
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ErrorHintComponent,
    FontAwesomeModule,
    NgIf,
    MatTooltipModule,
  ],
  standalone: true,
})
export class EditAgeComponent extends EditComponent<DateWithAge> {
  dateChanged(event: MatDatepickerInputEvent<any>) {
    if (event.value) {
      this.formControl.setValue(new DateWithAge(event.value));
    }
  }
}
