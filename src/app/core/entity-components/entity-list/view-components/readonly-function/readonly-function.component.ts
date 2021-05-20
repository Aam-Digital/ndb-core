import { Component } from "@angular/core";
import { ColumnCellConfig } from "../../EntityListConfig";
import { ViewComponent } from "../view-component";

@Component({
  selector: "app-readonly-function",
  templateUrl: "./readonly-function.component.html",
  styleUrls: ["./readonly-function.component.scss"],
})
export class ReadonlyFunctionComponent extends ViewComponent {
  displayFunction: (Entity) => any;
  onInitFromDynamicConfig(config: ColumnCellConfig) {
    super.onInitFromDynamicConfig(config);
    this.displayFunction = config.config;
  }
}
