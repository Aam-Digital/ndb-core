import { Component } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { GeoResult } from "../geo.service";

@DynamicComponent("ViewLocation")
@Component({
  selector: "app-view-location",
  template: "{{ value?.display_name }}",
  standalone: true,
})
export class ViewLocationComponent extends ViewDirective<GeoResult> {}
