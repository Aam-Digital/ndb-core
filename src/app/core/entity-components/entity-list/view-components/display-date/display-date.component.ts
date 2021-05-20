import { Component } from "@angular/core";
import { ColumnCellConfig } from "../../EntityListConfig";
import { ViewComponent } from "../view-component";

/**
 * This component displays a date attribute using the shortDate format.
 */
@Component({
  selector: "app-display-date",
  template: `{{ entity[property] | date: format }}`,
})
export class DisplayDateComponent extends ViewComponent{
  format = "shortDate";

  onInitFromDynamicConfig(config: ColumnCellConfig) {
    super.onInitFromDynamicConfig(config);
    if (config.config && typeof config.config === "string") {
      this.format = config.config;
    }
  }
}
