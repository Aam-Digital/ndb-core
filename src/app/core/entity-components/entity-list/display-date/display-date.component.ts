import { Component } from "@angular/core";
import { ColumnCellConfig } from "../EntityListConfig";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";

/**
 * This component displays a date attribute using the shortDate format.
 */
@Component({
  selector: "app-display-date",
  template: `{{ dateText | date: format }}`,
})
export class DisplayDateComponent implements OnInitDynamicComponent {
  format = "shortDate";
  public dateText = "";

  constructor() {}

  onInitFromDynamicConfig(config: ColumnCellConfig) {
    this.dateText = config.entity[config.id];
    if (config.config && typeof config.config === "string") {
      this.format = config.config;
    }
  }
}
