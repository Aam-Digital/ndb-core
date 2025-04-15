import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Panel, PanelComponent, PanelConfig } from "../EntityDetailsConfig";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Angulartics2OnModule } from "angulartics2";
import { MatTabsModule } from "@angular/material/tabs";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { CommonModule, NgForOf, NgIf } from "@angular/common";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { EntityActionsMenuComponent } from "../entity-actions-menu/entity-actions-menu.component";
import { EntityArchivedInfoComponent } from "../entity-archived-info/entity-archived-info.component";
import { UntilDestroy } from "@ngneat/until-destroy";
import { RouteTarget } from "../../../route-target";
import { AbstractEntityDetailsComponent } from "../abstract-entity-details/abstract-entity-details.component";
import { ViewActionsComponent } from "../../common-components/view-actions/view-actions.component";
import { AblePurePipe } from "@casl/angular";

/**
 * This component can be used to display an entity in more detail.
 * It groups subcomponents in panels.
	@@ -62,6 +67,16 @@ export class EntityDetailsComponent
   */
  @Input() panels: Panel[] = [];

  override async ngOnChanges(changes: SimpleChanges) {
    await super.ngOnChanges(changes);

	@@ -81,6 +96,20 @@ export class EntityDetailsComponent
    }));
  }

  private getPanelConfig(c: PanelComponent): PanelConfig {
    let panelConfig: PanelConfig = {
      entity: this.entity,
      creatingNew: this.entity.isNew,
    };
    if (typeof c.config === "object" && !Array.isArray(c.config)) {
      panelConfig = { ...c.config, ...panelConfig };
    } else {
      panelConfig.config = c.config;
    }
    return panelConfig;
  }
}
