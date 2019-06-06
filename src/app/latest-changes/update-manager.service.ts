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

import {ApplicationRef, Injectable} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';
import {first} from 'rxjs/operators';
import {concat, interval} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class UpdateManagerService {

  private notificationRef;

  constructor(
    private appRef: ApplicationRef,
    private updates: SwUpdate,
    public snackBar: MatSnackBar) {

  }

  public notifyUserWhenUpdateAvailable() {
    this.updates.available.subscribe(event => {
      this.showUpdateNotification();
    });
  }

  public regularlyCheckForUpdates() {
    // Allow the app to stabilize first, before starting polling for updates with `interval()`.
    const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable === true));
    const everyHours$ = interval(60 * 60 * 1000);
    const everyHoursOnceAppIsStable$ = concat(appIsStable$, everyHours$);

    everyHoursOnceAppIsStable$.subscribe(() => this.updates.checkForUpdate());
  }


  private showUpdateNotification() {
    this.notificationRef = this.snackBar.open('A new version of the app is available!', 'Update');
    this.notificationRef.onAction().subscribe(() => {
      location.reload();
    });
  }
}
