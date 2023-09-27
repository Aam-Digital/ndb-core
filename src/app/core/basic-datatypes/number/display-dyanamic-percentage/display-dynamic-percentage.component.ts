import { Component } from "@angular/core";
import { ViewDirective } from "app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";
import { DisplayPercentageComponent } from "../display-percentage/display-percentage.component";

/**
 * Dynamically calculate the ratio between two properties of the entity,
 * as configured.
 */
@DynamicComponent("DisplayDynamicPercentage")
@Component({
  selector: "app-display-dynamic-percentage",
  template:
    "<app-display-percentage [value]=calculateValue() [config]=config></app-display-percentage>",
  standalone: true,
  imports: [DisplayPercentageComponent],
})
export class DisplayDynamicPercentageComponent extends ViewDirective<
  number,
  { total: string; actual: string; decimalPlaces?: number }
> {
  /**
   * dynamically calculate the ratio of the actual / total values.
   * This is defined as a function to re-calculate on every change detection cycle as the value remains outdated otherwise.
   */
  calculateValue() {
    if (
      Number.isFinite(this.entity[this.config.actual]) &&
      Number.isFinite(this.entity[this.config.total]) &&
      this.entity[this.config.total] != 0
    ) {
      return (
        (this.entity[this.config.actual] / this.entity[this.config.total]) * 100
      );
    }
  }
}
