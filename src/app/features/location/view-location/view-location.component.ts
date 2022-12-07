import { Component } from "@angular/core";
import { DynamicComponent } from "../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ViewDirective } from "../../../core/entity-components/entity-utils/view-components/view.directive";
import { GeoResult } from "../geo.service";

@DynamicComponent("ViewLocation")
@Component({
  selector: "app-view-location",
  template: "{{ value?.display_name }}",
})
export class ViewLocationComponent extends ViewDirective<GeoResult> {}
