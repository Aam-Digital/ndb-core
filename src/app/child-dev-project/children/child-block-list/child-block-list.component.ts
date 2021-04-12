import { Component } from "@angular/core";
import { OnInitDynamicComponent } from "../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { ColumnCellConfig } from "../../../core/entity-components/entity-list/EntityListConfig";

/**
 * A component to display a list of children using the child block component.
 * A list of children IDs needs to be provided.
 */
@Component({
  selector: "app-child-block-list",
  templateUrl: "./child-block-list.component.html",
})
export class ChildBlockListComponent implements OnInitDynamicComponent {
  public children: string[] = [];

  constructor() {}

  onInitFromDynamicConfig(config: ColumnCellConfig) {
    this.children = config.entity[config.id];
  }
}
