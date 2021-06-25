import { Component } from "@angular/core";
import { ViewComponent } from "../../entity-components/entity-utils/view-components/view-component";

/**
 * This component displays a text attribute.
 */
@Component({
  selector: "app-display-configurable-enum",
  template: `{{ entity[property]?.label }}`,
})
export class DisplayConfigurableEnumComponent extends ViewComponent {}
