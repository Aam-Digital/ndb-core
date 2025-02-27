import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
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
import { AbilityModule } from "@casl/angular";
import { RouteTarget } from "../../../route-target";
import { AbstractEntityDetailsComponent } from "../abstract-entity-details/abstract-entity-details.component";
import { ViewActionsComponent } from "../../common-components/view-actions/view-actions.component";
import { EntityTypeLabelPipe } from "../../common-components/entity-type-label/entity-type-label.pipe";
import { ImportAdditionalService } from "../../import/additional-actions/import-additional.service";
import { AdditionalImportAction } from "../../import/additional-actions/additional-import-action";
import { EntityFieldLabelComponent } from "../../common-components/entity-field-label/entity-field-label.component";

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
    EntityActionsMenuComponent,
    EntityArchivedInfoComponent,
    RouterLink,
    AbilityModule,
    CommonModule,
    ViewActionsComponent,
    EntityTypeLabelPipe,
    EntityFieldLabelComponent,
  ],
})
export class EntityDetailsComponent
  extends AbstractEntityDetailsComponent
  implements OnChanges
{
  /**
   * The configuration for the panels on this details page.
   */
  @Input() panels: Panel[] = [];

  private readonly importAdditionalService = inject(ImportAdditionalService);
  importAdditionalEntityTypes: (AdditionalImportAction & { _json: string })[];

  override async ngOnChanges(changes: SimpleChanges) {
    await super.ngOnChanges(changes);

    if (changes.id || changes.entity || changes.panels) {
      this.initPanels();
      this.updateImportOptions();
    }
  }

  private updateImportOptions() {
    this.importAdditionalEntityTypes = this.importAdditionalService
      .getActionsLinkingTo(this.entityType)
      .map((a) => ({ ...a, targetId: this.entity.getId() }))
      .map((a) => ({ ...a, _json: JSON.stringify(a) }));
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
