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

import { Component, Input } from "@angular/core";
import { DynamicComponentConfig } from "../../config/dynamic-components/dynamic-component-config.interface";
import { NgFor } from "@angular/common";
import { DynamicComponentDirective } from "../../config/dynamic-components/dynamic-component.directive";
import { RouteTarget } from "../../../route-target";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { ComponentRegistry } from "../../../dynamic-components";
import { DashboardWidget } from "../dashboard-widget/dashboard-widget";
import { SessionSubject } from "../../session/auth/session-info";

@RouteTarget("Dashboard")
@Component({
  selector: "app-dashboard",
  template: ` <ng-template
    *ngFor="let widgetConfig of _widgets"
    [appDynamicComponent]="widgetConfig"
  ></ng-template>`,
  styleUrls: ["./dashboard.component.scss"],
  imports: [NgFor, DynamicComponentDirective],
  standalone: true,
})
export class DashboardComponent implements DashboardConfig {
  @Input() set widgets(widgets: DynamicComponentConfig[]) {
    this.filterPermittedWidgets(widgets).then((res) => (this._widgets = res));
  }
  get widgets(): DynamicComponentConfig[] {
    return this._widgets;
  }
  _widgets: DynamicComponentConfig[] = [];

  constructor(
    private ability: EntityAbility,
    private components: ComponentRegistry,
    private session: SessionSubject,
  ) {}

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
