import { Component } from "@angular/core";
import { Child } from "../../../child-dev-project/children/model/child";

@Component({
  selector: "app-public-form",
  templateUrl: "./public-form.component.html",
  styleUrls: ["./public-form.component.scss"],
})
export class PublicFormComponent {
  entity = new Child();
  columns = [
    ["name"],
    ["projectNumber"],
    ["gender"],
    ["center"],
    ["dateOfBirth"],
  ];
}
