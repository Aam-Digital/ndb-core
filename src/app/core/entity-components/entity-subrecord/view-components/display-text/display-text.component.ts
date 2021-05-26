import { Component } from "@angular/core";
import { ViewComponent } from "../view-component";

/**
 * This component displays a text attribute.
 */
@Component({
  selector: "app-display-text",
  template: `{{ entity[property] }}`,
})
export class DisplayTextComponent extends ViewComponent {}
