import { Component } from "@angular/core";
import { EditComponent, EditComponentConfig } from "../edit-component";

@Component({
  selector: "app-readonly-function",
  templateUrl: "./readonly-function.component.html",
  styleUrls: ["./readonly-function.component.scss"],
})
export class ReadonlyFunctionComponent extends EditComponent<void> {
  displayFunction: (Entity) => any;
  onInitFromDynamicConfig(config: EditComponentConfig) {
    super.onInitFromDynamicConfig(config);
    this.displayFunction = config.formFieldConfig.displayFunction;
  }
}
