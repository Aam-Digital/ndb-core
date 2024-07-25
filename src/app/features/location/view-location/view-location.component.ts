import { Component } from "@angular/core";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { GeoLocation } from "../location.datatype";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@DynamicComponent("ViewLocation")
@Component({
  selector: "app-view-location",
  templateUrl: "./view-location.component.html",
  standalone: true,
  imports: [FaIconComponent],
})
export class ViewLocationComponent extends ViewDirective<GeoLocation> {}
