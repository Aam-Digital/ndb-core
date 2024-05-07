import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Router } from "@angular/router";
import { NgClass, NgIf } from "@angular/common";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";
import { LoggingService } from "../../../logging/logging.service";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";

/**
 * Display an inline block representing an entity.
 */
@Component({
  selector: "app-entity-block",
  templateUrl: "./entity-block.component.html",
  styleUrls: ["./entity-block.component.scss"],
  imports: [NgClass, NgIf, DynamicComponentDirective, FaDynamicIconComponent],
  standalone: true,
})
export class EntityBlockComponent implements OnInit {
  @Input() entityToDisplay: Entity;
  @Input() linkDisabled = false;

  /**
   * If `entityToDisplay` is not set, `entityId` with prefix required to load the entity
   * If `entityToDisplay` is set, this input is ignored
   */
  @Input() entityId: string;

  entityBlockComponent: string;
  entityIcon: string;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
    private logger: LoggingService,
  ) {}

  async ngOnInit() {
    if (!this.entityToDisplay) {
      await this.loadEntity();
    }

    this.initDisplayDetails();
  }

  private async loadEntity() {
    if (!this.entityId) {
      return;
    }

    try {
      this.entityToDisplay = await this.entityMapper.load(
        Entity.extractTypeFromId(this.entityId),
        this.entityId,
      );
    } catch (e) {
      // this may be caused by restrictive permissions and therefore shouldn't be treated as a technical issue
      this.logger.debug(
        `[DISPLAY_ENTITY] Could not find entity with ID: ${this.entityId}: ${e}`,
      );
    }
  }

  private initDisplayDetails() {
    if (!this.entityToDisplay) {
      return;
    }

    const entityType = this.entityToDisplay.getConstructor();

    this.entityBlockComponent = entityType.getBlockComponent();
    this.entityIcon = entityType.icon;
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
