import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { DisplayEntityComponent } from "../../entity/display-entity/display-entity.component";
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

  constructor(
    private entityMapper: EntityMapperService,
    private changeDetector: ChangeDetectorRef,
  ) {
    super();
  }

  async ngOnInit() {
    const entityIds: string[] = this.value || [];
    if (entityIds.length < this.aggregationThreshold) {
      const entityPromises = entityIds.map((entityId) => {
        const type =
          typeof this.config === "string"
            ? this.config
            : Entity.extractTypeFromId(entityId);
        return this.entityMapper.load(type, entityId);
      });
      this.entities = await Promise.all(entityPromises);
      this.changeDetector.detectChanges();
    }
  }
}
