import { Component } from "@angular/core";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import { DatePipe } from "@angular/common";

/**
 * This component displays a date attribute using the shortDate format.
 */
@DynamicComponent("DisplayDate")
@Component({
  selector: "app-display-date",
  template: `{{ value | date : format }}`,
  standalone: true,
  imports: [DatePipe],
})
export class DisplayDateComponent extends ViewDirective<Date> {
  format = "yyyy-MM-dd";

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    if (config.config && typeof config.config === "string") {
      this.format = config.config;
    }
  }
}
