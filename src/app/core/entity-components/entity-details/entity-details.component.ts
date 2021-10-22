import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import {
  EntityDetailsConfig,
  Panel,
  PanelComponent,
  PanelConfig,
} from "./EntityDetailsConfig";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { getUrlWithoutParams } from "../../../utils/utils";
import {
  OperationType,
} from "../../permissions/entity-permissions.service";
import { UntilDestroy } from "@ngneat/until-destroy";
import { RouteData } from "../../view/dynamic-routing/view-config.interface";
import { AnalyticsService } from "../../analytics/analytics.service";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../entity/entity-remove.service";
import { DynamicEntityService } from "../../entity/dynamic-entity.service";
import { EntityAbility } from "../../permissions/ability.service";

/**
 * This component can be used to display a entity in more detail.
 * It groups subcomponents in panels.
 * Any component from the DYNAMIC_COMPONENT_MAP can be used as a subcomponent.
 * The subcomponents will be provided with the Entity object and the creating new status, as well as it's static config.
 */
@UntilDestroy()
@Component({
  selector: "app-entity-details",
  templateUrl: "./entity-details.component.html",
  styleUrls: ["./entity-details.component.scss"],
})
export class EntityDetailsComponent {
  entity: Entity;
  creatingNew = false;

  operationType = OperationType;

  panels: Panel[] = [];
  iconName: string;
  config: EntityDetailsConfig;

  constructor(
    private entityMapperService: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private analyticsService: AnalyticsService,
    private ability: EntityAbility,
    private entityRemoveService: EntityRemoveService,
    private dynamicEntityService: DynamicEntityService
  ) {
    this.route.data.subscribe((data: RouteData<EntityDetailsConfig>) => {
      this.config = data.config;
      this.iconName = data.config.icon;
      this.route.paramMap.subscribe((params) =>
        this.loadEntity(params.get("id"))
      );
    });
  }

  private loadEntity(id: string) {
    const constr = this.dynamicEntityService.getEntityConstructor(
      this.config.entity
    );
    if (id === "new") {
      if (this.ability.cannot("create", constr)) {
        this.router.navigate([""]);
        return;
      }
      this.entity = new constr();
      this.creatingNew = true;
      this.setPanelsConfig();
    } else {
      this.creatingNew = false;
      this.entityMapperService.load<Entity>(constr, id).then((entity) => {
        this.entity = entity;
        this.setPanelsConfig();
      });
    }
  }

  private setPanelsConfig() {
    this.panels = this.config.panels.map((p) => {
      return {
        title: p.title,
        components: p.components.map((c) => {
          return {
            title: c.title,
            component: c.component,
            config: this.getPanelConfig(c),
          };
        }),
      };
    });
  }

  private getPanelConfig(c: PanelComponent): PanelConfig {
    return {
      entity: this.entity,
      config: c.config,
      creatingNew: this.creatingNew,
    };
  }

  removeEntity() {
    const currentUrl = getUrlWithoutParams(this.router);
    this.entityRemoveService.remove(this.entity).subscribe(async (result) => {
      switch (result) {
        case RemoveResult.REMOVED:
          this.navigateBack();
          break;
        case RemoveResult.UNDONE:
          await this.router.navigate([currentUrl]);
      }
    });
  }

  navigateBack() {
    this.location.back();
  }

  /**
   * Usage analytics tracking when a section is opened.
   * (directive `angulartics2On="click"` doesn't work as it fires too often and blocks events within the panel)
   * @param panelTitle
   */
  trackPanelOpen(panelTitle: string) {
    this.analyticsService.eventTrack("details_section_expanded", {
      category: this.config?.entity,
      label: panelTitle,
    });
  }
}
