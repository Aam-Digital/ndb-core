import { Component } from "@angular/core";
import { ViewDirective } from "../../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "app/core/config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayLongText")
@Component({
  selector: "app-display-long-text",
  template: 'Display Text{{ value !== undefined ? value + " " + config : "" }}',
  standalone: true,
})
export class DisplayLongTextComponent extends ViewDirective<string, string> {}
