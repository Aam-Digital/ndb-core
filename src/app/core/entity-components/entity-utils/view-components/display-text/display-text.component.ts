import { Component } from "@angular/core";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

/**
 * This component displays a text attribute.
 */
@DynamicComponent("DisplayText")
@Component({
  selector: "app-display-text",
  template: `{{ value }}`,
})
export class DisplayTextComponent extends ViewDirective<string> {}
