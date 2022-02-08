import { Component } from "@angular/core";
import { EditComponent } from "../edit-component";
import { calculateAge } from "../../../../../utils/utils";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

@DynamicComponent()
@Component({
  selector: "app-edit-age",
  templateUrl: "./edit-age.component.html",
  styleUrls: ["./edit-age.component.scss"],
})
export class EditAgeComponent extends EditComponent<Date> {
  getAge(selectedDateOfBirth: Date) {
    return selectedDateOfBirth ? calculateAge(selectedDateOfBirth) : "";
  }
}
