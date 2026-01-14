/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, Input, inject, signal } from "@angular/core";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { RouteTarget } from "../../../route-target";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { ComponentRegistry } from "../../../dynamic-components";
import { DashboardWidget } from "../dashboard-widget/dashboard-widget";
import { SessionSubject } from "../../session/auth/session-info";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconButton } from "@angular/material/button";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AblePurePipe } from "@casl/angular";
import { AsyncPipe } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";

@RouteTarget("Dashboard")
@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  imports: [
    DynamicComponentDirective,
    MatMenuModule,
    MatIconButton,
    FaIconComponent,
    RouterLink,
    AblePurePipe,
    AsyncPipe,
    MatTooltipModule,
  ],
})
export class DashboardComponent implements DashboardConfig {
  private ability = inject(EntityAbility);
  private components = inject(ComponentRegistry);
  private session = inject(SessionSubject);
  private readonly activeRoute = inject(ActivatedRoute);

  @Input() set widgets(widgets: DynamicComponentConfig[]) {
    this.filterPermittedWidgets(widgets).then((res) => this._widgets.set(res));
  }
  get widgets(): DynamicComponentConfig[] {
    return this._widgets();
  }
  _widgets = signal<DynamicComponentConfig[]>([]);

  dashboardViewId: string = this.activeRoute.snapshot.url.join("/");

  private async filterPermittedWidgets(
    widgets: DynamicComponentConfig[],
  ): Promise<DynamicComponentConfig[]> {
    const permittedWidgets: DynamicComponentConfig[] = [];
    for (const widget of widgets) {
      if (
        this.hasRequiredRole(widget) &&
        (await this.hasEntityPermission(widget))
      ) {
        permittedWidgets.push(widget);
      }
    }
    return permittedWidgets;
  }

  private hasRequiredRole(widget: DynamicComponentConfig) {
    if (widget.permittedUserRoles?.length > 0) {
      const userRoles = this.session.value.roles;
      const requiredRoles = widget.permittedUserRoles;
      return requiredRoles.some((role) => userRoles.includes(role));
    } else {
      return true;
    }
  }

  private async hasEntityPermission(widget: DynamicComponentConfig) {
    const comp = (await this.components.get(
      widget.component,
    )()) as unknown as typeof DashboardWidget;
    let entity: string | string[];
    if (typeof comp.getRequiredEntities === "function") {
      entity = comp.getRequiredEntities(widget.config);
    }
    return this.userHasAccess(entity);
  }

  private userHasAccess(entity: string | string[]): boolean {
    if (entity) {
      if (Array.isArray(entity)) {
        return entity.some((e) => this.ability.can("read", e));
      } else {
        return this.ability.can("read", entity);
      }
    }
    // No entity relation -> show widget
    return true;
  }
}

export interface DashboardConfig {
  widgets: DynamicComponentConfig[];
}
