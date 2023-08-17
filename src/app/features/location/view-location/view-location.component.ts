import { Component } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { ViewDirective } from "../../../core/entity-components/entity-properties/view/view.directive";
import { GeoResult } from "../geo.service";

@DynamicComponent("ViewLocation")
@Component({
  selector: "app-view-location",
  template: "{{ value?.display_name }}",
  standalone: true,
})
export class ViewLocationComponent extends ViewDirective<GeoResult> {}
