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

import { catchError, map } from "rxjs/operators";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { Changelog } from "./changelog";
import { AlertService } from "../alerts/alert.service";
import { HttpClient } from "@angular/common/http";
import { MatDialog } from "@angular/material/dialog";
import { ChangelogComponent } from "./changelog/changelog.component";
import { CookieService } from "ngx-cookie-service";

/**
 * Manage the changelog information and display it to the user
 * on request or automatically on the first visit of a new version after update.
 */
@Injectable()
export class LatestChangesService {
  private static COOKIE_NAME = "AppVersion";

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private dialog: MatDialog,
    private cookieService: CookieService
  ) {}

  /**
   * Load the changelog document.
   */
  getChangelogs(): Observable<Changelog[]> {
    return this.http.get<Changelog[]>("assets/changelog.json").pipe(
      map((response) => response),
      catchError((error) => {
        this.alertService.addWarning("Could not load latest changes: " + error);
        return throwError("Could not load latest changes.");
      })
    );
  }

  /**
   * Get current app version inferred from the latest changelog entry.
   */
  getCurrentVersion(): Observable<string> {
    return this.getChangelogs().pipe(map((changelog) => changelog[0].tag_name));
  }

  /**
   * Open a modal window displaying the changelog of the latest version.
   */
  public showLatestChanges(): void {
    this.dialog.open(ChangelogComponent, {
      width: "400px",
      data: this.getChangelogs(),
    });
  }

  /**
   * Display the latest changes info box automatically if the current user has not seen this version before.
   */
  public showLatestChangesIfUpdated() {
    this.getCurrentVersion().subscribe((currentVersion) => {
      if (this.cookieService.check(LatestChangesService.COOKIE_NAME)) {
        const previousVersion = this.cookieService.get(
          LatestChangesService.COOKIE_NAME
        );
        if (currentVersion !== previousVersion) {
          this.showLatestChanges();
        }
      }
      this.cookieService.set(LatestChangesService.COOKIE_NAME, currentVersion);
    });
  }
}
