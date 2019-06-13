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

import {Injectable} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import {Alert} from './alert';
import {AlertComponent} from './alerts/alert.component';
import {LoggingService} from '../logging/logging.service';
import {AlertDisplay} from './alert-display';

@Injectable()
export class AlertService {

  alerts: Alert[] = [];

  constructor(public snackBar: MatSnackBar,
              private loggingService: LoggingService) {
  }

  addAlert(alert: Alert) {
    this.alerts.push(alert);
    this.displayAlert(alert);
    this.logToConsole(alert);
  }

  private displayAlert(alert: Alert) {
    const snackConfig = {data: alert, duration: 10000, panelClass: 'alerts-snackbar'};

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

    alert.notificationRef = this.snackBar.openFromComponent(AlertComponent, snackConfig);
  }

  private logToConsole(alert: Alert) {
    switch (alert.type) {
      case Alert.WARNING:
      case Alert.DANGER:
        console.warn(alert.message);
        this.loggingService.warn(alert.message);
        break;
      case Alert.INFO:
      case Alert.SUCCESS:
        console.log(alert.message);
        this.loggingService.info(alert.message);
        break;
      case Alert.DEBUG:
        console.log(alert.message);
        this.loggingService.debug(alert.message);
        break;
    }
  }


  removeAlert(alert: Alert) {
    const index = this.alerts.indexOf(alert, 0);
    if (index > -1) {
      this.alerts.splice(index, 1);
    }
  }


  public addInfo(message: string, display: AlertDisplay = AlertDisplay.TEMPORARY) {
    this.addAlert(new Alert(message, Alert.INFO, display));
  }

  public addSuccess(message: string, display: AlertDisplay = AlertDisplay.TEMPORARY) {
    this.addAlert(new Alert(message, Alert.SUCCESS, display));
  }

  public addWarning(message: string, display: AlertDisplay = AlertDisplay.PERSISTENT) {
    this.addAlert(new Alert(message, Alert.WARNING, display));
  }

  public addDanger(message: string, display: AlertDisplay = AlertDisplay.PERSISTENT) {
    this.addAlert(new Alert(message, Alert.DANGER, display));
  }

  public addDebug(message: string, display: AlertDisplay = AlertDisplay.NONE) {
    this.addAlert(new Alert(message, Alert.DEBUG, display));
  }
}
