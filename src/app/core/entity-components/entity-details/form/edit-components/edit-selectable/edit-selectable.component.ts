import { Component } from "@angular/core";
import { EditComponent, EditComponentConfig } from "../edit-component";

@Component({
  selector: "app-edit-selectable",
  templateUrl: "./edit-selectable.component.html",
  styleUrls: ["./edit-selectable.component.scss"],
})
export class EditSelectableComponent extends EditComponent {
  options: string[];
  onInitFromDynamicConfig(config: EditComponentConfig) {
    super.onInitFromDynamicConfig(config);
    this.options = config.formFieldConfig.options || config.propertySchema.ext;
  }
}
