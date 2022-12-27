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
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyCardModule as MatCardModule } from "@angular/material/legacy-card";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";
import { ChildrenModule } from "../../child-dev-project/children/children.module";
import { ProgressDashboardComponent } from "./progress-dashboard/progress-dashboard.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DashboardModule } from "../../core/dashboard/dashboard.module";
import { ViewModule } from "../../core/view/view.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EditProgressDashboardComponent } from "./edit-progress-dashboard/edit-progress-dashboard.component";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { CommonComponentsModule } from "../../core/common-components/common-components.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
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
