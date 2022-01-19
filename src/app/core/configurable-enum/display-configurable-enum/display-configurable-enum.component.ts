import { Component } from "@angular/core";
import { ViewDirective } from "../../entity-components/entity-utils/view-components/view.directive";

/**
 * This component displays a text attribute.
 */
@Component({
  selector: "app-display-configurable-enum",
  template: `{{ entity[property]?.label }}`,
})
export class DisplayConfigurableEnumComponent extends ViewDirective {}
