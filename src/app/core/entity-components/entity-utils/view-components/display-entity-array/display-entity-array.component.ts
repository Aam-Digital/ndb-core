import { Component } from "@angular/core";
import { Entity } from "../../../../entity/model/entity";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { ViewComponent } from "../view-component";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { ENTITY_MAP } from "../../../entity-details/entity-details.component";

@Component({
  selector: "app-display-entity-array",
  templateUrl: "./display-entity-array.component.html",
  styleUrls: ["./display-entity-array.component.scss"],
})
export class DisplayEntityArrayComponent extends ViewComponent {
  readonly aggregationThreshold = 5;
  entities: Entity[];
  constructor(private entityMapper: EntityMapperService) {
    super();
  }

  async onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    const entityIds: string[] = this.entity[this.property] || [];
    if (entityIds.length < this.aggregationThreshold) {
      const entityType = this.entity.getSchema().get(this.property).additional;
      const entityConstructor = ENTITY_MAP.get(entityType);
      if (!entityConstructor) {
        throw new Error(`Could not find type ${entityType} in ENTITY_MAP`);
      }
      const entityPromises = entityIds.map((entityId) =>
        this.entityMapper.load(entityConstructor, entityId)
      );
      this.entities = await Promise.all(entityPromises);
    }
  }
}
