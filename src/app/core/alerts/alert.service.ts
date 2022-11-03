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
import { MatSnackBar } from "@angular/material/snack-bar";

import { Alert } from "./alert";
import { AlertComponent } from "./alerts/alert.component";
import { AlertDisplay } from "./alert-display";
import { Observable } from "rxjs";

/**
 * Display alerts to the user as a hovering message at the bottom of the view.
 * (Angular Material "SnackBar")
 *
 * Inject this service in your classes to easily trigger alerts in the app consistent style.
 *
 * If you want to log technical details and problems, use {@link LoggingService} instead!
 * This service is for user facing messages.
 */
@Injectable()
export class AlertService {
  /** All alerts currently to be displayed */
  alerts: Alert[] = [];

  constructor(public snackBar: MatSnackBar) {}

  /**
   * Display the given alert.
   * @param alert The alert instance to be displayed
   */
  addAlert(alert: Alert) {
    this.alerts.push(alert);
    this.displayAlert(alert);
  }

  private displayAlert(alert: Alert) {
    const snackConfig = {
      data: alert,
      duration: 10000,
      panelClass: "alerts-snackbar",
    };

    switch (alert.display) {
      case AlertDisplay.NONE:
        return;
      case AlertDisplay.TEMPORARY:
        snackConfig.duration = 5000;
        break;
      case AlertDisplay.PERSISTENT:
        snackConfig.duration = 3600000;
        break;
    }

    alert.notificationRef = this.snackBar.openFromComponent(
      AlertComponent,
      snackConfig
    );
  }

  /**
   * Remove an existing alert so that it is no longer displayed.
   * @param alert The alert to be removed
   */
  removeAlert(alert: Alert) {
    const index = this.alerts.indexOf(alert, 0);
    if (index > -1) {
      this.alerts.splice(index, 1);
      alert.notificationRef.dismiss();
    }
  }

  /**
   * Display an alert message of "Info" level, that will automatically dismiss itself after a timeout.
   * @param message The text to be displayed
   * @param display Optional override of the display style (e.g. whether the alert has to be actively dismissed by the user)
   */
  public addInfo(
    message: string,
    display: AlertDisplay = AlertDisplay.TEMPORARY
  ) {
    this.addAlert(new Alert(message, Alert.INFO, display));
  }

  /**
   * Display an alert message of "Warning" level, that will have to be actively dismissed by the user.
   * @param message The text to be displayed
   * @param display Optional override of the display style (e.g. whether the alert has to be actively dismissed by the user)
   */
  public addWarning(
    message: string,
    display: AlertDisplay = AlertDisplay.PERSISTENT
  ) {
    this.addAlert(new Alert(message, Alert.WARNING, display));
  }

  /**
   * Display an alert message of "Danger" level, that is highlighted and will have to be actively dismissed by the user.
   * @param message The text to be displayed
   * @param display Optional override of the display style (e.g. whether the alert has to be actively dismissed by the user)
   */
  public addDanger(
    message: string,
    display: AlertDisplay = AlertDisplay.PERSISTENT
  ) {
    this.addAlert(new Alert(message, Alert.DANGER, display));
  }

  /**
   * Shows a message together with a progress bar.
   * @param message The text to be displayed
   * @param progress An observable that emits numbers between 0 and 100
   * @returns Alert which can be used to close it after finishing
   */
  public addProgress(message: string, progress: Observable<number>): Alert {
    const alert = new Alert(
      message,
      Alert.INFO,
      AlertDisplay.PERSISTENT,
      progress
    );
    this.addAlert(alert);
    return alert;
  }
}
