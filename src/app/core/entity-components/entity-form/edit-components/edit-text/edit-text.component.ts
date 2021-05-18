import { Component } from "@angular/core";
import { EditComponent, EditComponentConfig } from "../edit-component";

@Component({
  selector: "app-edit-text",
  templateUrl: "./edit-text.component.html",
  styleUrls: ["./edit-text.component.scss"],
})
export class EditTextComponent extends EditComponent<string> {
  onInitFromDynamicConfig(config: EditComponentConfig) {
    super.onInitFromDynamicConfig(config);
    console.log("text", this);
  }
}
