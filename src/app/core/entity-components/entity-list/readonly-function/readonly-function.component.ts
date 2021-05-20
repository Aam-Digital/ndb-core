import { Component } from "@angular/core";
import { ColumnCellConfig } from "../EntityListConfig";
import { Entity } from "../../../entity/entity";

@Component({
  selector: "app-readonly-function",
  templateUrl: "./readonly-function.component.html",
  styleUrls: ["./readonly-function.component.scss"],
})
export class ReadonlyFunctionComponent {
  entity: Entity;
  displayFunction: (Entity) => any;
  onInitFromDynamicConfig(config: ColumnCellConfig) {
    this.entity = config.entity;
    this.displayFunction = config.config;
  }
}
