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
import { SyncStatusComponent } from "./sync-status/sync-status.component";
import { SessionModule } from "../session/session.module";
import { AlertsModule } from "../alerts/alerts.module";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";
import { MatBadgeModule } from "@angular/material/badge";
import { MatLegacyMenuModule as MatMenuModule } from "@angular/material/legacy-menu";
import { BackgroundProcessingIndicatorComponent } from "./background-processing-indicator/background-processing-indicator.component";
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from "@angular/material/legacy-progress-spinner";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@NgModule({
  imports: [
    CommonModule,
    SessionModule,
    AlertsModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FontAwesomeModule,
  ],
  declarations: [SyncStatusComponent, BackgroundProcessingIndicatorComponent],
  exports: [SyncStatusComponent],
  providers: [],
})
export class SyncStatusModule {}
