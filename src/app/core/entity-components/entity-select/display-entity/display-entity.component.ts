import { Component, Input, OnInit } from "@angular/core";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { ViewPropertyConfig } from "../../entity-list/EntityListConfig";
import { ViewDirective } from "../../entity-utils/view-components/view.directive";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { Router } from "@angular/router";

@DynamicComponent("DisplayEntity")
@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
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

  entityBlockComponent: string;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router
  ) {
    super();
  }

  async ngOnInit() {
    if (!this.entityToDisplay && this.entityId && this.entityType) {
      this.entityToDisplay = await this.entityMapper.load(
        this.entityType,
        this.entityId
      );
    }
    if (this.entityToDisplay) {
      this.entityBlockComponent = this.entityToDisplay
        .getConstructor()
        .getBlockComponent();
    }
  }

  async onInitFromDynamicConfig(config: ViewPropertyConfig) {
    super.onInitFromDynamicConfig(config);
    if (this.value) {
      const type =
        config.config || this.entity.getSchema().get(this.property).additional;
      this.entityToDisplay = await this.entityMapper
        .load(type, this.value)
        .catch(() => undefined);
      this.ngOnInit();
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
