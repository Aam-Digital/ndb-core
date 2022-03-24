import { Component } from "@angular/core";
import {
  EditComponent,
  EditPropertyConfig,
} from "../../entity-components/entity-utils/dynamic-form-components/edit-component";
import { ConfigurableEnumValue } from "../configurable-enum.interface";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("EditConfigurableEnum")
@Component({
  selector: "app-edit-configurable-enum",
  templateUrl: "./edit-configurable-enum.component.html",
  styleUrls: ["./edit-configurable-enum.component.scss"],
})
export class EditConfigurableEnumComponent extends EditComponent<ConfigurableEnumValue> {
  enumId: string;

  onInitFromDynamicConfig(config: EditPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.enumId =
      config.formFieldConfig.additional ||
      config.propertySchema.additional ||
      config.propertySchema.innerDataType;
  }
}
