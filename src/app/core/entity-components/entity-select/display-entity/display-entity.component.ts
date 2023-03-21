import { Component, Input, OnInit } from "@angular/core";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { ViewDirective } from "../../entity-utils/view-components/view.directive";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { Router } from "@angular/router";
import { NgClass, NgIf } from "@angular/common";
import { DynamicComponentDirective } from "../../../view/dynamic-components/dynamic-component.directive";

@DynamicComponent("DisplayEntity")
@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
  imports: [NgClass, NgIf, DynamicComponentDirective],
  standalone: true,
})
export class DisplayEntityComponent
  extends ViewDirective<string>
  implements OnInit
{
  @Input() entityToDisplay: Entity;
  @Input() linkDisabled = false;

  /**
   * If `entityToDisplay` is not set, `entityId` and `entityType` are required to load the entity
   * If `entityToDisplay` is set, these values are ignored
   */
  @Input() entityId: string;
  @Input() entityType: string | EntityConstructor;
  @Input() config: string;

  entityBlockComponent: string;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router
  ) {
    super();
  }

  async ngOnInit() {
    if (!this.entityToDisplay) {
      if (this.entityId && this.entityType) {
        this.entityToDisplay = await this.entityMapper.load(
          this.entityType,
          this.entityId
        );
      } else if (this.config || (this.entity && this.id)) {
        const type =
          this.config || this.entity.getSchema().get(this.id).additional;
        this.entityToDisplay = await this.entityMapper
          .load(type, this.value)
          .catch(() => undefined);
      }
    }
    if (this.entityToDisplay) {
      this.entityBlockComponent = this.entityToDisplay
        .getConstructor()
        .getBlockComponent();
    }
  }

  showDetailsPage() {
    if (this.linkDisabled) {
      return;
    }

    this.router.navigate([
      this.entityToDisplay.getConstructor().route,
      this.entityToDisplay.getId(),
    ]);
  }
}
