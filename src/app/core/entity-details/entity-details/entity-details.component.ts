import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterLink } from "@angular/router";
import { AblePurePipe } from "@casl/angular";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { UntilDestroy } from "@ngneat/until-destroy";
import { Angulartics2OnModule } from "angulartics2";
import { RouteTarget } from "../../../route-target";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { EntityLoadPipe } from "../../common-components/entity-load/entity-load.pipe";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { ViewActionsComponent } from "../../common-components/view-actions/view-actions.component";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { SessionSubject } from "../../session/auth/session-info";
import { AbstractEntityDetailsComponent } from "../abstract-entity-details/abstract-entity-details.component";
import { EntityActionsMenuComponent } from "../entity-actions-menu/entity-actions-menu.component";
import { EntityArchivedInfoComponent } from "../entity-archived-info/entity-archived-info.component";
import { EntityLastEditedInfoComponent } from "../../../features/change-history/entity-last-edited-info/entity-last-edited-info.component";
import { Panel, PanelComponent, PanelConfig } from "../EntityDetailsConfig";

/**
 * This component can be used to display an entity in more detail.
 * It groups subcomponents in panels.
 * Any component that is registered (has the `DynamicComponent` decorator) can be used as a subcomponent.
 * The subcomponents will be provided with the Entity object and the creating new status, as well as its static config.
 */
@RouteTarget("EntityDetails")
@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-entity-details",
  templateUrl: "./entity-details.component.html",
  styleUrls: ["./entity-details.component.scss"],
  imports: [
    AblePurePipe,
    MatButtonModule,
    MatMenuModule,
    FontAwesomeModule,
    Angulartics2OnModule,
    MatTabsModule,
    TabStateModule,
    MatTooltipModule,
    MatProgressBarModule,
    ViewTitleComponent,
    DynamicComponentDirective,
    EntityActionsMenuComponent,
    EntityArchivedInfoComponent,
    EntityLastEditedInfoComponent,
    FaDynamicIconComponent,
    RouterLink,
    CommonModule,
    ViewActionsComponent,
    EntityLoadPipe,
  ],
})
export class EntityDetailsComponent extends AbstractEntityDetailsComponent {
  /**
   * The configuration for the panels on this details page.
   */
  panels = input<Panel[]>([]);

  private session = inject(SessionSubject);

  readonly panelsState = computed<Panel[]>(() => {
    const entity = this.entity();
    if (!entity) return [];

    let filteredPanels = this.panels()
      .filter((p) =>
        this.hasRequiredRole({ permittedUserRoles: p?.permittedUserRoles }),
      )
      .map((p) => ({
        title: p.title,
        components: p.components.map((c) => ({
          title: c.title,
          component: c.component,
          config: this.getPanelConfig(c),
        })),
      }));

    const hasUserSecurityPanel = filteredPanels.some((panel) =>
      panel.components.some((c) => c.component === "UserSecurity"),
    );

    if (this.entityConstructor()?.enableUserAccounts && !hasUserSecurityPanel) {
      filteredPanels.push({
        title: $localize`:Panel title:User Account`,
        components: [
          {
            title: "",
            component: "UserSecurity",
            config: this.getPanelConfig({ component: "UserSecurity" }),
          },
        ],
      });
    }

    return filteredPanels;
  });

  /**
   * Checks if the current user has access based on permitted user roles.
   * Accepts a config object containing an optional `permittedUserRoles` array.
   * Returns true if roles are not specified or if the user matches any role.
   */
  private hasRequiredRole({
    permittedUserRoles,
  }: {
    permittedUserRoles?: string[];
  }): boolean {
    if (!permittedUserRoles || permittedUserRoles.length === 0) return true;
    const userRoles = this.session.value.roles;
    return permittedUserRoles.some((role) => userRoles.includes(role));
  }

  private getPanelConfig(c: PanelComponent): PanelConfig {
    const entity = this.entity();
    let panelConfig: PanelConfig = {
      entity,
      creatingNew: entity?.isNew,
    };
    if (typeof c.config === "object" && !Array.isArray(c.config)) {
      panelConfig = { ...c.config, ...panelConfig };
    } else {
      panelConfig.config = c.config;
    }
    return panelConfig;
  }
}
