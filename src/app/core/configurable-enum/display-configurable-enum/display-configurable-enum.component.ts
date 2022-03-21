import { Component } from "@angular/core";
import { ViewDirective } from "../../entity-components/entity-utils/view-components/view.directive";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";

/**
 * This component displays a text attribute.
 */
@DynamicComponent("DisplayConfigurableEnum")
@Component({
  selector: "app-display-configurable-enum",
  template: `{{ entity[property]?.label }}`,
})
export class DisplayConfigurableEnumComponent extends ViewDirective {}
