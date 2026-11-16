import { Component, computed, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatMenuModule } from "@angular/material/menu";
import { EntityBlockComponent } from "../../../core/basic-datatypes/entity/entity-block/entity-block.component";
import { FaDynamicIconComponent } from "../../../core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { getEntityRuntimeRoute } from "../../../core/entity/entity-config.service";
import { Entity } from "../../../core/entity/model/entity";
import { WhiteboardEntityItem } from "../model/whiteboard-item";
import { WhiteboardItemMenuComponent } from "../whiteboard-item-menu/whiteboard-item-menu.component";

/**
 * A card on the whiteboard representing one record.
 */
@Component({
  selector: "app-whiteboard-entity-card",
  templateUrl: "./whiteboard-entity-card.component.html",
  styleUrl: "./whiteboard-entity-card.component.scss",
  imports: [
    EntityBlockComponent,
    FaDynamicIconComponent,
    WhiteboardItemMenuComponent,
    MatMenuModule,
    RouterLink,
  ],
})
export class WhiteboardEntityCardComponent {
  item = input.required<WhiteboardEntityItem>();
  /** the loaded record; the card shows a "not available" placeholder while undefined */
  entity = input<Entity>();
  readonly = input(false);

  readonly addLinked = output<void>();
  readonly connect = output<void>();
  readonly remove = output<void>();

  readonly typeLabel = computed(() => this.entity()?.getConstructor().label);
  readonly color = computed(() => {
    const entity = this.entity();
    return entity ? Entity.getColorWithConditions(entity) : undefined;
  });
  readonly detailsLink = computed(() => {
    const entity = this.entity();
    return entity
      ? [getEntityRuntimeRoute(entity.getConstructor()), entity.getId(true)]
      : undefined;
  });
}
