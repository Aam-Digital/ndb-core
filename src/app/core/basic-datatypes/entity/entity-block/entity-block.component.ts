import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { Router } from "@angular/router";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { DynamicComponentDirective } from "../../../config/dynamic-components/dynamic-component.directive";
import { Logging } from "../../../logging/logging.service";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { TemplateTooltipDirective } from "../../../common-components/template-tooltip/template-tooltip.directive";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { DisplayImgComponent } from "../../../../features/file/display-img/display-img.component";
import { EntityBlockConfig } from "./entity-block-config";
import { EntityFieldViewComponent } from "../../../common-components/entity-field-view/entity-field-view.component";

/**
 * Display an inline block representing an entity.
 */
@Component({
  selector: "app-entity-block",
  templateUrl: "./entity-block.component.html",
  styleUrls: ["./entity-block.component.scss"],
  imports: [
    NgClass,
    NgIf,
    DynamicComponentDirective,
    FaDynamicIconComponent,
    TemplateTooltipDirective,
    FaIconComponent,
    NgForOf,
    DisplayImgComponent,
    EntityFieldViewComponent,
  ],
  standalone: true,
})
export class EntityBlockComponent implements OnInit {
  @Input() entity: Entity;
  @Input() linkDisabled = false;

  /**
   * If `entityToDisplay` is not set, `entityId` with prefix required to load the entity
   * If `entityToDisplay` is set, this input is ignored
   */
  @Input() entityId: string;

  entityBlockConfig: EntityBlockConfig;
  entityIcon: string;

  constructor(
    private entityMapper: EntityMapperService,
    private router: Router,
  ) {}

  async ngOnInit() {
    if (!this.entity) {
      await this.loadEntity();
    }

    this.initDisplayDetails();
  }

  private async loadEntity() {
    if (!this.entityId) {
      return;
    }

    try {
      this.entity = await this.entityMapper.load(
        Entity.extractTypeFromId(this.entityId),
        this.entityId,
      );
    } catch (e) {
      // this may be caused by restrictive permissions and therefore shouldn't be treated as a technical issue
      Logging.debug(
        "[DISPLAY_ENTITY] Could not find entity.",
        this.entityId,
        e,
      );
    }
  }

  private initDisplayDetails() {
    if (!this.entity) {
      return;
    }

    const entityType = this.entity.getConstructor();

    this.entityBlockConfig = entityType.toBlockDetailsAttributes;
    this.entityIcon = entityType.icon;
  }

  showDetailsPage() {
    if (this.linkDisabled) {
      return;
    }

    this.router.navigate([
      this.entity.getConstructor().route,
      this.entity.getId(true),
    ]);
  }
}
