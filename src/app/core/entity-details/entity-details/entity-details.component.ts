import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  EntityDetailsConfig,
  Panel,
  PanelComponent,
  PanelConfig,
} from "../EntityDetailsConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { RouteData } from "../../config/dynamic-routing/view-config.interface";
import { AnalyticsService } from "../../analytics/analytics.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { RouteTarget } from "../../../app.routing";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Angulartics2OnModule } from "angulartics2";
import { MatTabsModule } from "@angular/material/tabs";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { NgForOf, NgIf } from "@angular/common";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { LoggingService } from "../../logging/logging.service";
import { UnsavedChangesService } from "../form/unsaved-changes.service";
import { EntityActionsMenuComponent } from "../entity-actions-menu/entity-actions-menu.component";

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
  standalone: true,
  imports: [
    MatButtonModule,
    MatMenuModule,
    FontAwesomeModule,
    Angulartics2OnModule,
    MatTabsModule,
    TabStateModule,
    MatTooltipModule,
    MatProgressBarModule,
    NgIf,
    NgForOf,
    ViewTitleComponent,
    DynamicComponentDirective,
    DisableEntityOperationDirective,
    EntityActionsMenuComponent,
  ],
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
    private ability: EntityAbility,
    private entities: EntityRegistry,
    private logger: LoggingService,
    public unsavedChanges: UnsavedChangesService,
  ) {
    this.route.data.subscribe((data: RouteData<EntityDetailsConfig>) => {
      this.config = data.config;
      this.entityConstructor = this.entities.get(this.config.entity);
      this.setInitialPanelsConfig();
      this.route.paramMap.subscribe((params) =>
        this.loadEntity(params.get("id")),
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
        .load(this.entityConstructor, id)
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
    let panelConfig: PanelConfig = {
      entity: this.entity,
      creatingNew: this.creatingNew,
    };
    if (typeof c.config === "object" && !Array.isArray(c.config)) {
      if (c.config?.entity) {
        this.logger.warn(
          `DEPRECATION panel config uses 'entity' keyword: ${JSON.stringify(
            c,
          )}`,
        );
        c.config["entityType"] = c.config.entity;
        delete c.config.entity;
      }
      panelConfig = { ...c.config, ...panelConfig };
    } else {
      panelConfig.config = c.config;
    }
    return panelConfig;
  }

  trackTabChanged(index: number) {
    this.analyticsService.eventTrack("details_tab_changed", {
      category: this.config?.entity,
      label: this.config.panels[index].title,
    });
  }
}
