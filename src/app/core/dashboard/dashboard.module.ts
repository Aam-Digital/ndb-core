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

import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { ViewModule } from "../view/view.module";
import { DashboardWidgetComponent } from "./dashboard-widget/dashboard-widget.component";
import { WidgetContentComponent } from "./dashboard-widget/widget-content/widget-content.component";
import { MatTableModule } from "@angular/material/table";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { FaDynamicIconComponent } from "../view/fa-dynamic-icon/fa-dynamic-icon.component";

@NgModule({
  imports: [
    CommonModule,
    ViewModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FontAwesomeModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    FaDynamicIconComponent,
  ],
  declarations: [DashboardWidgetComponent, WidgetContentComponent],
  exports: [DashboardWidgetComponent, WidgetContentComponent],
})
export class DashboardModule {}
