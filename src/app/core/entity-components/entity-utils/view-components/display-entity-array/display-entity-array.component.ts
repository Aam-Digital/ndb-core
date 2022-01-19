import { Component } from "@angular/core";
import { Entity } from "../../../../entity/model/entity";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { ViewDirective } from "../view.directive";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { DynamicEntityService } from "../../../../entity/dynamic-entity.service";

@Component({
  selector: "app-display-entity-array",
  templateUrl: "./display-entity-array.component.html",
  styleUrls: ["./display-entity-array.component.scss"],
})
export class DisplayEntityArrayComponent extends ViewDirective {
  readonly aggregationThreshold = 5;
  entities: Entity[];
  constructor(
    private entityMapper: EntityMapperService,
    private dynamicEntityService: DynamicEntityService
  ) {
    super();
  }

  async onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    const entityIds: string[] = this.entity[this.property] || [];
    if (entityIds.length < this.aggregationThreshold) {
      const entityType = this.entity.getSchema().get(this.property).additional;
      const entityConstructor = this.dynamicEntityService.getEntityConstructor(
        entityType
      );
      const entityPromises = entityIds.map((entityId) =>
        this.entityMapper.load(entityConstructor, entityId)
      );
      this.entities = await Promise.all(entityPromises);
    }
  }
}
