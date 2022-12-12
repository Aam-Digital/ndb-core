import { ChangeDetectionStrategy, Component } from "@angular/core";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { ViewDirective } from "../../../../core/entity-components/entity-utils/view-components/view.directive";
import { ViewPropertyConfig } from "../../../../core/entity-components/entity-list/EntityListConfig";
import { generateLabelFromInterval, TimeInterval } from "../time-interval";

@DynamicComponent("DisplayRecurringInterval")
@Component({
  selector: "app-display-recurring-interval",
  template: "{{ label }}",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayRecurringIntervalComponent extends ViewDirective<TimeInterval> {
  label: string;

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    if (this.value) {
      this.label = generateLabelFromInterval(this.value);
    }
  }
}
