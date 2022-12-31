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

import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { DynamicComponentConfig } from "../../view/dynamic-components/dynamic-component-config.interface";
import { RouteData } from "../../view/dynamic-routing/view-config.interface";
import { RouteTarget } from "../../../app.routing";
import { ViewModule } from "../../view/view.module";
import { NgFor } from "@angular/common";

@RouteTarget("Dashboard")
@Component({
  selector: "app-dashboard",
  template: ` <ng-template
    *ngFor="let widgetConfig of widgets"
    [appDynamicComponent]="widgetConfig"
  ></ng-template>`,
  styleUrls: ["./dashboard.component.scss"],
  imports: [ViewModule, NgFor],
  standalone: true,
})
export class DashboardComponent implements OnInit {
  widgets: DynamicComponentConfig[] = [];

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.data.subscribe(
      (data: RouteData<{ widgets: DynamicComponentConfig[] }>) => {
        this.widgets = data.config.widgets;
      }
    );
  }
}
