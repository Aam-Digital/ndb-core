import { Component } from "@angular/core";
import { ViewDirective } from "../view.directive";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";

@DynamicComponent("DisplayUnit")
@Component({
  selector: "app-display-unit",
  template: '{{ value ? value + " " + config : "" }}',
  standalone: true,
})
export class DisplayUnitComponent extends ViewDirective<string, string> {}
