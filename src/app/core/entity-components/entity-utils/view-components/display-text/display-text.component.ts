import { Component } from "@angular/core";
import { ViewDirective } from "../view.directive";

/**
 * This component displays a text attribute.
 */
@Component({
  selector: "app-display-text",
  template: `{{ entity[property] }}`,
})
export class DisplayTextComponent extends ViewDirective {}
