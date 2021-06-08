import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";

@Component({
  selector: "app-edit-selectable",
  templateUrl: "./edit-selectable.component.html",
  styleUrls: ["./edit-selectable.component.scss"],
})
export class EditSelectableComponent extends EditComponent<any> {
  options: (string | { label: string; value: string })[];
  onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.options =
      config.formFieldConfig.additional || config.propertySchema.additional;
  }
}
