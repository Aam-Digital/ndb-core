import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  EntityDetailsConfig,
  Panel,
  PanelComponent,
  PanelConfig,
} from "../EntityDetailsConfig";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
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
import { EntityArchivedInfoComponent } from "../entity-archived-info/entity-archived-info.component";
import { filter } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subscription } from "rxjs";

/**
 * This component can be used to display an entity in more detail.
 * It groups subcomponents in panels.
 * Any component that is registered (has the `DynamicComponent` decorator) can be used as a subcomponent.
 * The subcomponents will be provided with the Entity object and the creating new status, as well as its static config.
 */
@RouteTarget("EntityDetails")
@UntilDestroy()
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
    EntityArchivedInfoComponent,
    RouterLink,
  ],
})
export class EntityDetailsComponent implements EntityDetailsConfig, OnChanges {
  creatingNew = false;
  isLoading = true;
  private changesSubscription: Subscription;

  /** @deprecated use "entityType" instead, this remains for config backwards compatibility */
  @Input() set entity(v: string) {
    this.entityType = v;
  }
  @Input() entityType: string;
  entityConstructor: EntityConstructor;

  @Input() id: string;
  record: Entity;

  @Input() panels: Panel[] = [];

  constructor(
    private entityMapperService: EntityMapperService,
    private router: Router,
    private analyticsService: AnalyticsService,
    private ability: EntityAbility,
    private entities: EntityRegistry,
    private logger: LoggingService,
    public unsavedChanges: UnsavedChangesService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.entity || changes.entityType) {
      this.entityConstructor = this.entities.get(this.entityType);
    }
    if (changes.id) {
      this.loadEntity(this.id);
      this.subscribeToEntityChanges();
      // `initPanels()` is already called inside `loadEntity()`
    } else if (changes.panels) {
      this.initPanels();
    }
  }

  private subscribeToEntityChanges() {
    this.changesSubscription?.unsubscribe();
    this.changesSubscription = this.entityMapperService
      .receiveUpdates(this.entityConstructor)
      .pipe(
        filter(({ entity }) => entity.getId() === this.id),
        filter(({ type }) => type !== "remove"),
        untilDestroyed(this),
      )
      .subscribe(({ entity }) => (this.record = entity));
  }

  private async loadEntity(id: string) {
    if (id === "new") {
      if (this.ability.cannot("create", this.entityConstructor)) {
        this.router.navigate([""]);
        return;
      }
      this.record = new this.entityConstructor();
      this.creatingNew = true;
    } else {
      this.creatingNew = false;
      this.record = await this.entityMapperService.load(
        this.entityConstructor,
        id,
      );
    }
    this.initPanels();
    this.isLoading = false;
  }

  private initPanels() {
    this.panels = this.panels.map((p) => ({
      title: p.title,
      components: p.components.map((c) => ({
        title: c.title,
        component: c.component,
        config: this.getPanelConfig(c),
      })),
    }));
  }

  private getPanelConfig(c: PanelComponent): PanelConfig {
    let panelConfig: PanelConfig = {
      entity: this.record,
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
      category: this.entityType,
      label: this.panels[index].title,
    });
  }
}
