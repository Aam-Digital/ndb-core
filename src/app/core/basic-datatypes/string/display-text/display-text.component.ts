import { Component, ChangeDetectionStrategy } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * This component displays a text attribute.
 */
@DynamicComponent("DisplayText")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-text",
  template: `{{ value }}`,
  standalone: true,
})
export class DisplayTextComponent extends ViewDirective<string> {}
