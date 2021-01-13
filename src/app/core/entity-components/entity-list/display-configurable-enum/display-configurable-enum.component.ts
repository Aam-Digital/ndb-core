import { Component } from "@angular/core";
import { ColumnCellConfig } from "../EntityListConfig";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { ConfigurableEnumValue } from "../../../configurable-enum/configurable-enum.interface";

/**
 * This component displays a text attribute.
 */
@Component({
  selector: "app-display-configurable-enum",
  template: `{{ value?.label }}`,
})
export class DisplayConfigurableEnumComponent
  implements OnInitDynamicComponent {
  public value: ConfigurableEnumValue;

  constructor() {}

  onInitFromDynamicConfig(config: ColumnCellConfig) {
    this.value = config.entity[config.id];
  }
}
