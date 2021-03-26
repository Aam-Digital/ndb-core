import { Component, Host, Input } from "@angular/core";
import { EntitySelectComponent } from "../entity-select/entity-select.component";
import { Entity } from "../../entity/entity";

@Component({
  selector: "app-entity-select-item",
  templateUrl: "./entity-select-item.component.html",
  styleUrls: ["./entity-select-item.component.scss"],
})
export class EntitySelectItemComponent<T extends Entity> {
  @Input() selectable: boolean = false;
  @Input() removable: boolean = true;
  @Input() entity: T;

  constructor(@Host() private select: EntitySelectComponent<T>) {}

  removeEntity() {
    this.select.removeEntity(this.entity);
  }
}
