import { Component, OnInit } from "@angular/core";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { ViewDirective } from "../../../../core/entity-components/entity-utils/view-components/view.directive";
import { generateLabelFromInterval, TimeInterval } from "../time-interval";

@DynamicComponent("DisplayRecurringInterval")
@Component({
  selector: "app-display-recurring-interval",
  template: "{{ label }}",
  standalone: true,
})
export class DisplayRecurringIntervalComponent
  extends ViewDirective<TimeInterval>
  implements OnInit
{
  label: string;

  ngOnInit() {
    if (this.value) {
      this.label = generateLabelFromInterval(this.value);
    }
  }
}
