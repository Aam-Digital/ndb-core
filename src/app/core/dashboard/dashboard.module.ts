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
import { FlexLayoutModule } from "@angular/flex-layout";
import { ViewModule } from "../view/view.module";
import { DashboardWidgetComponent } from "./dashboard-widget/dashboard-widget.component";
import { WidgetHeadlineComponent } from "./dashboard-widget/widget-headline/widget-header.component";
import { WidgetSubheadlineComponent } from "./dashboard-widget/widget-subheadline/widget-subheadline.component";
import { WidgetContentComponent } from "./dashboard-widget/widget-content/widget-content.component";
import { DashboardTableComponent } from "./dashboard-widget/dashboard-table/dashboard-table.component";
import { MatTableModule } from "@angular/material/table";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    ViewModule,
    MatTableModule,
    FontAwesomeModule,
  ],
  declarations: [
    DashboardComponent,
    DashboardWidgetComponent,
    WidgetHeadlineComponent,
    WidgetSubheadlineComponent,
    WidgetContentComponent,
    DashboardTableComponent,
  ],
  exports: [
    DashboardWidgetComponent,
    WidgetHeadlineComponent,
    WidgetSubheadlineComponent,
    WidgetContentComponent,
  ],
})
export class DashboardModule {}
