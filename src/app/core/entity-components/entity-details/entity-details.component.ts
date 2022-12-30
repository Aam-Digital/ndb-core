import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  EntityDetailsConfig,
  Panel,
  PanelComponent,
  PanelConfig,
} from "./EntityDetailsConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { getUrlWithoutParams } from "../../../utils/utils";
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
@RouteTarget("EntityDetails")
@Component({
  selector: "app-entity-details",
  templateUrl: "./entity-details.component.html",
  styleUrls: ["./entity-details.component.scss"],
})
export class EntityDetailsComponent {
  entity: Entity;
  creatingNew = false;
  isLoading = true;

  panels: Panel[] = [];
  config: EntityDetailsConfig;
  entityConstructor: EntityConstructor;

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
      this.entityConstructor = this.entities.get(this.config.entity);
      this.setInitialPanelsConfig();
      this.route.paramMap.subscribe((params) =>
        this.loadEntity(params.get("id"))
      );
    });
  }

  private loadEntity(id: string) {
    if (id === "new") {
      if (this.ability.cannot("create", this.entityConstructor)) {
        this.router.navigate([""]);
        return;
      }
      this.entity = new this.entityConstructor();
      this.creatingNew = true;
      this.setFullPanelsConfig();
    } else {
      this.creatingNew = false;
      this.entityMapperService
        .load<Entity>(this.entityConstructor, id)
        .then((entity) => {
          this.entity = entity;
          this.setFullPanelsConfig();
        });
    }
  }

  private setInitialPanelsConfig() {
    this.panels = this.config.panels.map((p) => ({
      title: p.title,
      components: [],
    }));
  }

  private setFullPanelsConfig() {
    this.panels = this.config.panels.map((p) => ({
      title: p.title,
      components: p.components.map((c) => ({
        title: c.title,
        component: c.component,
        config: this.getPanelConfig(c),
      })),
    }));
    this.isLoading = false;
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

  trackTabChanged(index: number) {
    this.analyticsService.eventTrack("details_tab_changed", {
      category: this.config?.entity,
      label: this.config.panels[index].title,
    });
  }
}
