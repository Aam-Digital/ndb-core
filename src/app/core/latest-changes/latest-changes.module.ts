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
import { AppVersionComponent } from "./app-version/app-version.component";
import { AlertsModule } from "../alerts/alerts.module";
import { HttpClientModule } from "@angular/common/http";
import { SessionModule } from "../session/session.module";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { ChangelogComponent } from "./changelog/changelog.component";
import { LOCATION_TOKEN, UpdateManagerService } from "./update-manager.service";
import { FlexModule } from "@angular/flex-layout";
import { MarkdownModule } from "ngx-markdown";
import { MatCardModule } from "@angular/material/card";
import { LatestChangesDialogService } from "./latest-changes-dialog.service";
import { LatestChangesService } from "./latest-changes.service";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

/**
 * Displaying app version and changelog information to the user
 * through components that can be used in other templates
 * as well as automatic popups on updates (see {@link UpdateManagerService}, {@link LatestChangesService}).
 *
 * Changelogs are dynamically loaded from GitHub Releases through the GitHub API.
 * pre-releases are excluded and individual lines in the body can be hidden by starting
 * text (after markdown characters) with a ".".
 */
@NgModule({
  imports: [
    CommonModule,
    AlertsModule,
    SessionModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    HttpClientModule,
    FlexModule,
    MarkdownModule,
    MatCardModule,
    FontAwesomeModule,
  ],
  declarations: [AppVersionComponent, ChangelogComponent],
  exports: [AppVersionComponent],
  providers: [
    LatestChangesService,
    LatestChangesDialogService,
    UpdateManagerService,
    { provide: LOCATION_TOKEN, useValue: window.location },
  ],
})
export class LatestChangesModule {
  constructor(private updateManagerService: UpdateManagerService) {
    this.updateManagerService.notifyUserWhenUpdateAvailable();
    this.updateManagerService.regularlyCheckForUpdates();
  }
}
