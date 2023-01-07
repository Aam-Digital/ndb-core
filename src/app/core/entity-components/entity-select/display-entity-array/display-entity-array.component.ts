import { Component } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ViewDirective } from "../../entity-utils/view-components/view.directive";
import { ViewPropertyConfig } from "../../entity-list/EntityListConfig";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { DisplayEntityComponent } from "../display-entity/display-entity.component";
import { NgForOf, NgIf } from "@angular/common";

@DynamicComponent("DisplayEntityArray")
@Component({
  selector: "app-display-entity-array",
  templateUrl: "./display-entity-array.component.html",
  imports: [DisplayEntityComponent, NgIf, NgForOf],
  standalone: true,
})
export class DisplayEntityArrayComponent extends ViewDirective<string[]> {
  readonly aggregationThreshold = 5;
  entities: Entity[];

  constructor(private entityMapper: EntityMapperService) {
    super();
  }

  async onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    const entityIds: string[] = this.value || [];
    if (entityIds.length < this.aggregationThreshold) {
      const entityType = this.entity.getSchema().get(this.property).additional;
      const entityPromises = entityIds.map((entityId) =>
        this.entityMapper.load(entityType, entityId)
      );
      this.entities = await Promise.all(entityPromises);
    }
  }
}
