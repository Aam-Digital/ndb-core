import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../../entity/entity";
import { DYNAMIC_COMPONENTS_MAP } from "../../../view/dynamic-components-map";

@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
})
export class DisplayEntityComponent implements OnInit {
  @Input() entity: Entity;
  entityBlockComponent: string;
  constructor() {}

  ngOnInit(): void {
    const blockComponentName = this.entity.getType() + "Block";
    if (DYNAMIC_COMPONENTS_MAP.has(blockComponentName)) {
      this.entityBlockComponent = blockComponentName;
    }
  }
}
