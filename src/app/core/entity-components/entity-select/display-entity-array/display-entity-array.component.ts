import { Component, OnInit } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ViewDirective } from "../../entity-utils/view-components/view.directive";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { DisplayEntityComponent } from "../display-entity/display-entity.component";
import { NgForOf, NgIf } from "@angular/common";

@DynamicComponent("DisplayEntityArray")
@Component({
  selector: "app-display-entity-array",
  templateUrl: "./display-entity-array.component.html",
  styleUrls: ["./display-entity-array.component.scss"],
  imports: [DisplayEntityComponent, NgIf, NgForOf],
  standalone: true,
})
export class DisplayEntityArrayComponent
  extends ViewDirective<string[], string>
  implements OnInit
{
  readonly aggregationThreshold = 5;

  entities: Entity[];

  constructor(private entityMapper: EntityMapperService) {
    super();
  }

  async ngOnInit() {
    const entityIds: string[] = this.value || [];
    if (entityIds.length < this.aggregationThreshold) {
      const entityType =
        this.config || this.entity.getSchema().get(this.id).additional;
      const entityPromises = entityIds.map((entityId) => {
        const type =
          typeof entityType === "string"
            ? entityType
            : Entity.extractTypeFromId(entityId);
        return this.entityMapper.load(type, entityId);
      });
      this.entities = await Promise.all(entityPromises);
    }
  }
}
