import { Component } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

/**
 * This component allows to display a boolean attribute of an entity.
 * It will display a checkmark when the attribute is true.
 */
@DynamicComponent("DisplayCheckmark")
@Component({
  selector: "app-display-tick",
  template: `{{ value ? "✓" : "" }}`,
  standalone: true,
})
export class DisplayCheckmarkComponent extends ViewDirective<boolean> {}
