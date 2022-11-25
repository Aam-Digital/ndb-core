import { Component } from "@angular/core";
import { DynamicComponent } from "../../view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../view/dynamic-components/on-init-dynamic-component.interface";

@DynamicComponent("ViewLocation")
@Component({
  selector: "app-view-location",
  templateUrl: "./view-location.component.html",
  styleUrls: ["./view-location.component.scss"],
})
export class ViewLocationComponent implements OnInitDynamicComponent {
  constructor() {}

  onInitFromDynamicConfig(config: any) {}
}
