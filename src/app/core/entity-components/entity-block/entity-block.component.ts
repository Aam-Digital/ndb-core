import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../entity/entity";
import { DYNAMIC_COMPONENTS_MAP } from "../../view/dynamic-components-map";

@Component({
  selector: "app-entity-block",
  templateUrl: "./entity-block.component.html",
})
export class EntityBlockComponent<E extends Entity> implements OnInit {
  blockName?: string;
  @Input() entity: E;

  ngOnInit() {
    const type = this.entity.getType();
    if (DYNAMIC_COMPONENTS_MAP.has(type + "Block")) {
      this.blockName = type + "Block";
    } else {
      this.blockName = undefined;
    }
  }
}
