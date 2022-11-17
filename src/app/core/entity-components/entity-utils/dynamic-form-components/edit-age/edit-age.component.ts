import { Component } from "@angular/core";
import { EditComponent } from "../edit-component";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { DateOfBirth } from "../../../../../child-dev-project/children/model/dateOfBirth";

@DynamicComponent("EditAge")
@Component({
  selector: "app-edit-age",
  templateUrl: "./edit-age.component.html",
})
export class EditAgeComponent extends EditComponent<DateOfBirth> {
  dateChanged(event: MatDatepickerInputEvent<any>) {
    this.formControl.setValue(new DateOfBirth(event.value));
  }
}
