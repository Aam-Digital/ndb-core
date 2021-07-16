import { Component } from "@angular/core";
import { ViewComponent } from "../view-component";

/**
 * This component allows to display a boolean attribute of an entity.
 * It will display a checkmark when the attribute is true.
 */
@Component({
  selector: "app-display-tick",
  template: `{{ entity[property] ? "✓" : "" }}`,
})
export class DisplayCheckmarkComponent extends ViewComponent {}
