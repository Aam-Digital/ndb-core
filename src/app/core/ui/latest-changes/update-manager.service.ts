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

import { ApplicationRef, Injectable, inject } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { filter, first } from "rxjs/operators";
import { concat, interval } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Logging } from "../../logging/logging.service";
import { LatestChangesDialogService } from "./latest-changes-dialog.service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";

/**
 * Check with the server whether a new version of the app is available in order to notify the user.
 *
 * As we are using ServiceWorkers to cache the app to also work offline, explicit checking for updates is necessary.
 * The user receives a toast (hover message) if an update is available
 * and can click that to reload the app with the new version.
 */
@Injectable({ providedIn: "root" })
export class UpdateManagerService {
  private appRef = inject(ApplicationRef);
  private updates = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);
  private latestChangesDialogService = inject(LatestChangesDialogService);
  private unsavedChanges = inject(UnsavedChangesService);
  private location = inject<Location>(LOCATION_TOKEN);

  private readonly UPDATE_PREFIX = "update-";

  constructor() {
    this.updates.unrecoverable.subscribe((err) => {
      Logging.error("App is in unrecoverable state: " + err.reason);
      this.location.reload();
    });
    const currentVersion = localStorage.getItem(
      LatestChangesDialogService.VERSION_KEY,
    );
    if (currentVersion && currentVersion.startsWith(this.UPDATE_PREFIX)) {
      localStorage.setItem(
        LatestChangesDialogService.VERSION_KEY,
        currentVersion.replace(this.UPDATE_PREFIX, ""),
      );
      this.location.reload();
    } else {
      this.latestChangesDialogService.showLatestChangesIfUpdated();
    }
  }

  /**
   * Display a notification to the user in case a new app version is detected by the ServiceWorker.
   */
  public listenToAppUpdates() {
    if (!this.updates.isEnabled) {
      return;
    }
    this.updates.versionUpdates
      .pipe(filter((e) => e.type === "VERSION_READY"))
      .subscribe(() => this.updateIfPossible());
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
      first((isStable) => isStable === true),
    );
    const everyHours$ = interval(60 * 60 * 1000);
    const everyHoursOnceAppIsStable$ = concat(appIsStable$, everyHours$);

    everyHoursOnceAppIsStable$.subscribe(() =>
      this.updates.checkForUpdate().catch((err) => Logging.error(err)),
    );
  }

  private updateIfPossible() {
    const currentVersion =
      localStorage.getItem(LatestChangesDialogService.VERSION_KEY) || "";
    if (currentVersion.startsWith(this.UPDATE_PREFIX)) {
      // Sometimes this is triggered multiple times for one update
      return;
    }

    if (this.unsavedChanges.pending) {
      // app cannot be safely reloaded
      localStorage.setItem(
        LatestChangesDialogService.VERSION_KEY,
        this.UPDATE_PREFIX + currentVersion,
      );
      this.snackBar
        .open(
          $localize`A new version of the app is available!`,
          $localize`:Action that a user can update the app with:Update`,
        )
        .onAction()
        .subscribe(() => {
          localStorage.setItem(
            LatestChangesDialogService.VERSION_KEY,
            currentVersion,
          );

          this.location.reload();
        });
    } else {
      this.location.reload();
    }
  }

  /**
   * Notifies user if app ends up in an unrecoverable state due to SW updates
   */
  public detectUnrecoverableState() {
    if (!this.updates.isEnabled) {
      return;
    }

    this.updates.unrecoverable.subscribe(({ reason }) => {
      Logging.warn(`SW in unrecoverable state: ${reason}`);
      this.snackBar
        .open(
          $localize`The app is in a unrecoverable state, please reload.`,
          $localize`:Action that a user can reload the app with:Reload`,
        )
        .onAction()
        .subscribe(() => this.location.reload());
    });
  }
}
