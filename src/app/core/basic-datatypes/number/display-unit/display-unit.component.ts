import { Component } from "@angular/core";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayUnit")
@Component({
  selector: "app-display-unit",
  template: '{{ value !== undefined ? value + " " + config : "" }}',
  standalone: true,
})
export class DisplayUnitComponent extends ViewDirective<string, string> {}
