import { Component, computed, ChangeDetectionStrategy } from "@angular/core";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { generateLabelFromInterval, TimeInterval } from "../time-interval";

@DynamicComponent("DisplayRecurringInterval")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-recurring-interval",
  template: "{{ label() }}",
  standalone: true,
})
export class DisplayRecurringIntervalComponent extends ViewDirective<TimeInterval> {
  readonly label = computed(() => {
    const value = this.value();
    return value ? generateLabelFromInterval(value) : "";
  });
}
