import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  EntityDetailsConfig,
  Panel,
  PanelComponent,
  PanelConfig,
} from "./EntityDetailsConfig";
import { Entity } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { getUrlWithoutParams } from "../../../utils/utils";
import { UntilDestroy } from "@ngneat/until-destroy";
import { RouteData } from "../../view/dynamic-routing/view-config.interface";
import { AnalyticsService } from "../../analytics/analytics.service";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../entity/entity-remove.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { RouteTarget } from "../../../app.routing";
import { EntityRegistry } from "../../entity/database-entity.decorator";

/**
 * This component can be used to display an entity in more detail.
 * It groups subcomponents in panels.
 * Any component that is registered (has the `DynamicComponent` decorator) can be used as a subcomponent.
 * The subcomponents will be provided with the Entity object and the creating new status, as well as its static config.
 */
@UntilDestroy()
@RouteTarget("EntityDetails")
@Component({
  selector: "app-entity-details",
  templateUrl: "./entity-details.component.html",
  styleUrls: ["./entity-details.component.scss"],
})
export class EntityDetailsComponent {
  entity: Entity;
  creatingNew = false;
  isLoading: boolean = true;

  panels: Panel[] = [];
  iconName: string;
  config: EntityDetailsConfig;

  constructor(
    private entityMapperService: EntityMapperService,
    private route: ActivatedRoute,
    private router: Router,
    private analyticsService: AnalyticsService,
    private entityRemoveService: EntityRemoveService,
    private ability: EntityAbility,
    private entities: EntityRegistry
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
    const constr = this.entities.get(this.config.entity);
    if (id === "new") {
      if (this.ability.cannot("create", constr)) {
        this.router.navigate([""]);
        return;
      }
      this.entity = new constr();
      this.creatingNew = true;
      this.setPanelsConfig();
    } else {
      console.log("loadEntity started.");
      this.creatingNew = false;
      this.entityMapperService.load<Entity>(constr, id).then((entity) => {
        this.entity = entity;
        this.setPanelsConfig();
        this.isLoading = false;
        console.log("loadEntity stopped.");
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
    const parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));
    this.entityRemoveService.remove(this.entity).subscribe(async (result) => {
      switch (result) {
        case RemoveResult.REMOVED:
          await this.router.navigate([parentUrl]);
          break;
        case RemoveResult.UNDONE:
          await this.router.navigate([currentUrl]);
      }
    });
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
