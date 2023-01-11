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
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";

import { AlertConfig, ExtendedAlertConfig } from "./alert-config";
import { AlertDisplay } from "./alert-display";

/**
 * Display alerts to the user as a hovering message at the bottom of the view.
 * (Angular Material "SnackBar")
 *
 * Inject this service in your classes to easily trigger alerts in the app consistent style.
 *
 * If you want to log technical details and problems, use {@link LoggingService} instead!
 * This service is for user facing messages.
 *
 * You can also use the {@link MatSnackBar} when you want to have more control over what you
 * want to display to the user.
 */
@Injectable({ providedIn: "root" })
export class AlertService {
  /** All alerts currently to be displayed */
  alerts: ExtendedAlertConfig[] = [];

  private static ALERT_BASE_CLASS = "ndb-alert";

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Display the given alert.
   * @param alert The alert instance to be displayed
   */
  addAlert(alert: AlertConfig) {
    this.alerts.push({ ...alert, timestamp: new Date() });
    this.displayAlert(alert);
  }

  private displayAlert(alert: AlertConfig) {
    const snackConfig: MatSnackBarConfig = {
      duration: 10000,
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

    snackConfig.panelClass = [
      AlertService.ALERT_BASE_CLASS,
      AlertService.ALERT_BASE_CLASS + "--" + alert.type,
    ];

    this.snackBar.open(
      alert.message,
      $localize`:alert dismiss action:dismiss`,
      snackConfig
    );
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
    this.addAlert({ message, type: "info", display });
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
    this.addAlert({ message, type: "warning", display });
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
    this.addAlert({ message, type: "danger", display });
  }
}
