import { Component } from "@angular/core";
import { EditComponent } from "../edit-component";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { DateWithAge } from "../../../../../child-dev-project/children/model/dateWithAge";

@DynamicComponent("EditAge")
@Component({
  selector: "app-edit-age",
  templateUrl: "./edit-age.component.html",
})
export class EditAgeComponent extends EditComponent<DateWithAge> {
  dateChanged(event: MatDatepickerInputEvent<any>) {
    if (event.value) {
      this.formControl.setValue(new DateWithAge(event.value));
    }
  }
}
