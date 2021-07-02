import { Component } from "@angular/core";
import { EditComponent } from "../edit-component";

@Component({
  selector: "app-edit-date",
  templateUrl: "./edit-date.component.html",
  styleUrls: ["./edit-date.component.scss"],
})
export class EditDateComponent extends EditComponent<Date> {}
