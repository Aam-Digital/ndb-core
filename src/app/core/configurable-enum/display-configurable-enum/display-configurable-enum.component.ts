import { Component } from "@angular/core";
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
export class DisplayConfigurableEnumComponent extends ViewDirective<ConfigurableEnumValue> {}
