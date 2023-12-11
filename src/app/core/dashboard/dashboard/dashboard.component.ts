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

@RouteTarget("Dashboard")
@Component({
  selector: "app-dashboard",
  template: ` <ng-template
    *ngFor="let widgetConfig of widgets"
    [appDynamicComponent]="widgetConfig"
  ></ng-template>`,
  styleUrls: ["./dashboard.component.scss"],
  imports: [NgFor, DynamicComponentDirective],
  standalone: true,
})
export class DashboardComponent implements DashboardConfig {
  @Input() widgets: DynamicComponentConfig[] = [];
}

export interface DashboardConfig {
  widgets: DynamicComponentConfig[];
}
