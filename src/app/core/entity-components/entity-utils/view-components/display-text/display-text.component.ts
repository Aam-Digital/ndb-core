import { Component } from "@angular/core";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

/**
 * This component displays a text attribute.
 */
@DynamicComponent()
@Component({
  selector: "app-display-text",
  template: `{{ entity[property] }}`,
})
export class DisplayTextComponent extends ViewDirective {}
