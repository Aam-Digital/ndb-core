import { Component, Inject } from "@angular/core";
import { Entity } from "../../../../entity/model/entity";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { ViewDirective } from "../view.directive";
import { ViewPropertyConfig } from "../../../entity-list/EntityListConfig";
import { DynamicComponent } from "../../../../view/dynamic-components/dynamic-component.decorator";
import {
  ENTITIES,
  EntityRegistry,
} from "../../../../registry/dynamic-registry";

@DynamicComponent()
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
    @Inject(ENTITIES) private entityRegistry: EntityRegistry
  ) {
    super();
  }

  async onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    const entityIds: string[] = this.entity[this.property] || [];
    if (entityIds.length < this.aggregationThreshold) {
      const entityType = this.entity.getSchema().get(this.property).additional;
      const entityConstructor = this.entityRegistry.get(entityType);
      const entityPromises = entityIds.map((entityId) =>
        this.entityMapper.load(entityConstructor, entityId)
      );
      this.entities = await Promise.all(entityPromises);
    }
  }
}
