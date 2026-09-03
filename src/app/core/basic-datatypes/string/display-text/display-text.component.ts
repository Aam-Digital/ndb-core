import { Component, ChangeDetectionStrategy, computed } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * This component displays a text attribute.
 *
 * Also the fallback for fields with no dataType, so `value()` isn't always a string.
 */
@DynamicComponent("DisplayText")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-text",
  template: `{{ displayValue() }}`,
  standalone: true,
})
export class DisplayTextComponent extends ViewDirective<string> {
  readonly displayValue = computed(() => {
    const value = this.value();
    return value !== null && typeof value === "object"
      ? JSON.stringify(value)
      : value;
  });
}
