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

import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ChangelogComponent } from "./changelog/changelog.component";
import { CookieService } from "ngx-cookie-service";
import { environment } from "../../../environments/environment";
import { LatestChangesService } from "./latest-changes.service";

/**
 * Manage the changelog information and display it to the user
 * on request or automatically on the first visit of a new version after update.
 */
@Injectable()
export class LatestChangesDialogService {
  private static COOKIE_NAME = "AppVersion";

  constructor(
    private dialog: MatDialog,
    private cookieService: CookieService,
    private latestChangesService: LatestChangesService
  ) {}

  /**
   * Get current app version inferred from the latest changelog entry.
   */
  getCurrentVersion(): string {
    return environment.appVersion;
  }

  /**
   * Open a modal window displaying the changelog of the latest version.
   * @param previousVersion (Optional) previous version back to which all changes should be displayed
   */
  public showLatestChanges(previousVersion?: string): void {
    this.dialog.open(ChangelogComponent, {
      width: "80%",
      data: this.latestChangesService.getChangelogsBetweenVersions(
        this.getCurrentVersion(),
        previousVersion
      ),
    });
  }

  /**
   * Display the latest changes info box automatically if the current user has not seen this version before.
   */
  public showLatestChangesIfUpdated() {
    if (this.cookieService.check(LatestChangesDialogService.COOKIE_NAME)) {
      const previousVersion = this.cookieService.get(
        LatestChangesDialogService.COOKIE_NAME
      );
      if (this.getCurrentVersion() !== previousVersion) {
        this.showLatestChanges(previousVersion);
      }
    }
    this.cookieService.set(
      LatestChangesDialogService.COOKIE_NAME,
      this.getCurrentVersion()
    );
  }
}
