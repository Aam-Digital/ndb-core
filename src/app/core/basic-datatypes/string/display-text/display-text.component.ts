import { Component } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * This component displays a text attribute.
 */
@DynamicComponent("DisplayText")
@Component({
  selector: "app-display-text",
  template: `{{ value }}`,
  standalone: true,
})
export class DisplayTextComponent extends ViewDirective<string> {}
