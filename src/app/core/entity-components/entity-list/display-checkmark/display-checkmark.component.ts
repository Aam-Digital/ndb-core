import { Component } from "@angular/core";
import { ColumnCellConfig } from "../EntityListConfig";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";

/**
 * This component allows to display a boolean attribute of an entity.
 * It will display a checkmark when the attribute is true.
 */
@Component({
  selector: "app-display-tick",
  template: `{{ boolAtr ? "✓" : "" }}`,
})
export class DisplayCheckmarkComponent implements OnInitDynamicComponent {
  public boolAtr: boolean;

  constructor() {}

  onInitFromDynamicConfig(config: ColumnCellConfig) {
    this.boolAtr = config.entity[config.id];
  }
}
