import { Component } from "@angular/core";
import { EditComponent } from "../edit-component";
import { calculateAge } from "../../../../../utils/utils";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("EditAge")
@Component({
  selector: "app-edit-age",
  templateUrl: "./edit-age.component.html",
})
export class EditAgeComponent extends EditComponent<Date> {
  getAge(selectedDateOfBirth: Date) {
    return selectedDateOfBirth ? calculateAge(selectedDateOfBirth) : "";
  }
}
