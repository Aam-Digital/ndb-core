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
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { ChildrenModule } from "../../child-dev-project/children/children.module";
import { ProgressDashboardComponent } from "./progress-dashboard/progress-dashboard.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DashboardModule } from "../../core/dashboard/dashboard.module";
import { ViewModule } from "../../core/view/view.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EditProgressDashboardComponent } from "./edit-progress-dashboard/edit-progress-dashboard.component";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTableModule } from "@angular/material/table";
import { CommonComponentsModule } from "../../core/common-components/common-components.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        MatCardModule,
        MatButtonModule,
        MatProgressBarModule,
        MatInputModule,
        MatFormFieldModule,
        ChildrenModule,
        DashboardModule,
        ViewModule,
        FontAwesomeModule,
        MatDialogModule,
        MatDividerModule,
        ReactiveFormsModule,
        MatTooltipModule,
        MatTableModule,
        CommonComponentsModule,
    ],
  declarations: [ProgressDashboardComponent, EditProgressDashboardComponent],
  exports: [ProgressDashboardComponent],
})
export class ProgressDashboardWidgetModule {
  static dynamicComponents = [ProgressDashboardComponent];
}
