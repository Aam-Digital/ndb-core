import { Component } from "@angular/core";
import { ViewComponent } from "../view-component";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";

@Component({
  selector: "app-display-unit",
  templateUrl: "./display-unit.component.html",
  styleUrls: ["./display-unit.component.scss"],
})
export class DisplayUnitComponent extends ViewComponent {
  unit: string;
  onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    this.unit =
      config.config || config.entity.getSchema().get(this.property).additional;
  }
}
