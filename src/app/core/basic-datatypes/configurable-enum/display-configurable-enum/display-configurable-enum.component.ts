import { Component, computed, ChangeDetectionStrategy } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

import { ConfigurableEnumValue } from "../configurable-enum.types";

/**
 * This component displays a {@link ConfigurableEnumValue} as text.
 * If the value has a `color` property, it is used as the background color.
 */
@DynamicComponent("DisplayConfigurableEnum")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-configurable-enum",
  templateUrl: "./display-configurable-enum.component.html",
  styleUrls: ["./display-configurable-enum.component.scss"],
  imports: [MatTooltipModule],
})
export class DisplayConfigurableEnumComponent extends ViewDirective<
  ConfigurableEnumValue | ConfigurableEnumValue[]
> {
  readonly iterableValue = computed<ConfigurableEnumValue[]>(() => {
    const value = this.value();
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });

  get extraLabels(): string {
    return this.iterableValue()
      .slice(3)
      .map((v) => v.label)
      .join(", ");
  }
}
