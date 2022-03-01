import { Component } from "@angular/core";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { ViewDirective } from "../view.directive";

/**
 * This component displays a date attribute using the shortDate format.
 */
@Component({
  selector: "app-display-date",
  template: `{{ entity[property] | date: format }}`,
})
export class DisplayDateComponent extends ViewDirective {
  format = "yyyy-MM-dd";

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    if (config.config && typeof config.config === "string") {
      this.format = config.config;
    }
  }
}
