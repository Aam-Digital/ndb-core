import { Component, Input, OnInit } from "@angular/core";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { ViewDirective } from "../../../entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Router } from "@angular/router";
import { NgClass, NgIf } from "@angular/common";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";
import { LoggingService } from "../../../logging/logging.service";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";

@DynamicComponent("DisplayEntity")
@Component({
  selector: "app-display-entity",
  templateUrl: "./display-entity.component.html",
  styleUrls: ["./display-entity.component.scss"],
  imports: [NgClass, NgIf, DynamicComponentDirective, FaDynamicIconComponent],
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
  entityIcon: string;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
    private logger: LoggingService,
  ) {
    super();
  }

  async ngOnInit() {
    if (!this.entityToDisplay) {
      this.entityId = this.entityId ?? this.value;
      this.entityType = (this.entityId ?? "").includes(":")
        ? Entity.extractTypeFromId(this.entityId)
        : this.entityType ?? this.config;
      if (!this.entityType || !this.entityId) {
        return;
      }

      try {
        this.entityToDisplay = await this.entityMapper.load(
          this.entityType,
          this.entityId,
        );
      } catch (e) {
        // this may be caused by restrictive permissions and therefore shouldn't be treated as a technical issue
        this.logger.debug(
          `[DISPLAY_ENTITY] Could not find entity with ID: ${this.entityId}: ${e}`,
        );
      }
    }
    if (this.entityToDisplay) {
      this.entityBlockComponent = this.entityToDisplay
        .getConstructor()
        .getBlockComponent();
      this.entityIcon = this.entityToDisplay.getConstructor().icon;
    }
  }

  showDetailsPage() {
    if (this.linkDisabled) {
      return;
    }

    this.router.navigate([
      this.entityToDisplay.getConstructor().route,
      this.entityToDisplay.getId(true),
    ]);
  }
}
