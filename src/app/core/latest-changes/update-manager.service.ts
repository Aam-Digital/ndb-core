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

import { ApplicationRef, Injectable } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { first } from "rxjs/operators";
import { concat, interval } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LoggingService } from "../logging/logging.service";

/**
 * Check with the server whether a new version of the app is available in order to notify the user.
 *
 * As we are using ServiceWorkers to cache the app to also work offline, explicit checking for updates is necessary.
 * The user receives a toast (hover message) if an update is available
 * and can click that to reload the app with the new version.
 */
@Injectable()
export class UpdateManagerService {
  private notificationRef;

  constructor(
    private appRef: ApplicationRef,
    private updates: SwUpdate,
    private snackBar: MatSnackBar,
    private logger: LoggingService
  ) {}

  /**
   * Display a notification to the user in case a new app version is detected by the ServiceWorker.
   */
  public notifyUserWhenUpdateAvailable() {
    console.log("service worker is", this.updates.isEnabled);
    if (!this.updates.isEnabled) {
      return;
    }

    this.updates.available.subscribe(() => {
      this.showUpdateNotification();
    });
  }

  /**
   * Schedule a regular check with the server for updates.
   */
  public regularlyCheckForUpdates() {
    if (!this.updates.isEnabled) {
      return;
    }

    // Allow the app to stabilize first, before starting polling for updates with `interval()`.
    const appIsStable$ = this.appRef.isStable.pipe(
      first((isStable) => isStable === true)
    );
    const everyHours$ = interval(60 * 60 * 1000);
    const everyHoursOnceAppIsStable$ = concat(appIsStable$, everyHours$);

    everyHoursOnceAppIsStable$.subscribe(async () => {
      try {
        await this.updates.checkForUpdate();
      } catch (err) {
        this.logger.error(err);
      }
    });
  }

  private showUpdateNotification() {
    this.notificationRef = this.snackBar.open(
      $localize`A new version of the app is available!`,
      $localize`:Action that a user can update the app with:Update`
    );
    this.notificationRef.onAction().subscribe(() => {
      location.reload();
    });
  }
}
