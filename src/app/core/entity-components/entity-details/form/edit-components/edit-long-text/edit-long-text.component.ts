import { Component } from "@angular/core";
import { EditComponent } from "../edit-component";

@Component({
  selector: "app-edit-long-text",
  templateUrl: "./edit-long-text.component.html",
  styleUrls: ["./edit-long-text.component.scss"],
})
export class EditLongTextComponent extends EditComponent<string> {}
