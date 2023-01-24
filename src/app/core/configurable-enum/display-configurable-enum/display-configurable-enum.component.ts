import { Component, HostBinding } from "@angular/core";
import { ViewPropertyConfig } from "app/core/entity-components/entity-list/EntityListConfig";
import { ViewDirective } from "../../entity-components/entity-utils/view-components/view.directive";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { ConfigurableEnumValue } from "../configurable-enum.interface";

/**
 * This component displays a {@link ConfigurableEnumValue} as text.
 * If the value has a `color` property, it is used as the background color.
 */
@DynamicComponent("DisplayConfigurableEnum")
@Component({
  selector: "app-display-configurable-enum",
  template: `{{ templateString }}`,
  standalone: true,
})
export class DisplayConfigurableEnumComponent extends ViewDirective<
  ConfigurableEnumValue | ConfigurableEnumValue[]
> {
  @HostBinding("style.background-color") private style;
  @HostBinding("style.padding") private padding;
  @HostBinding("style.border-radius") private radius;
  templateString = "";

  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    if (Array.isArray(this.value)) {
      this.templateString = this.value.map((v) => v.label).join(", ");
    } else if (this.value) {
      if (this.value.color) {
        this.style = this.value.color;
        this.padding = "5px";
        this.radius = "4px";
      }
      this.templateString = this.value.label;
    }
  }
}
