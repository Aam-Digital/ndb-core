import { Component, HostBinding } from "@angular/core";
import { ViewPropertyConfig } from "app/core/entity-components/entity-list/EntityListConfig";
import { ViewDirective } from "../../entity-components/entity-utils/view-components/view.directive";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { ConfigurableEnumValue } from "../configurable-enum.interface";

/**
 * This component displays a text attribute.
 */
@DynamicComponent("DisplayConfigurableEnum")
@Component({
  selector: "app-display-configurable-enum",
  template: `{{ value?.label }}`,
})
export class DisplayConfigurableEnumComponent extends ViewDirective<ConfigurableEnumValue> {
  @HostBinding ('style.background-color') style;
  @HostBinding ('style.padding') padding = '5px';
  @HostBinding ('style.border-radius') radius = '4px';
  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config)
    this.style = this.value.color;
} }
