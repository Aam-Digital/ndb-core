import { Component } from "@angular/core";
import { EditComponent, EditPropertyConfig } from "../edit-component";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("EditEntityArray")
@Component({
  selector: "app-edit-entity-array",
  templateUrl: "./edit-entity-array.component.html",
})
export class EditEntityArrayComponent extends EditComponent<string[]> {
  placeholder: string;
  entityName: string;
  onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.entityName =
      config.formFieldConfig.additional || config.propertySchema.additional;
    this.placeholder = $localize`:Placeholder for input to add entities|context Add User(s):Add ${this.label}`;
  }
}
