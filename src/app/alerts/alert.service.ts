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
import {MatSnackBar} from '@angular/material';

import {Alert} from './alert';
import {AlertComponent} from './alerts/alert.component';
import {LoggingService} from '../logging/logging.service';

@Injectable()
export class AlertService {

  alerts: Alert[] = [];

  constructor(public snackBar: MatSnackBar,
              private loggingService: LoggingService) {
  }

  addAlert(alert: Alert) {
    this.alerts.push(alert);
    this.openSnackBar(alert);
    this.logToConsole(alert);
  }

  private openSnackBar(alert: Alert) {
    const snackConfig = {data: alert, duration: 10000, panelClass: 'alerts-snackbar'};

    switch (alert.type) {
      case Alert.DEBUG:
        return;
      case Alert.SUCCESS:
      case Alert.INFO:
        snackConfig.duration = 5000;
        break;
      case Alert.DANGER:
      case Alert.WARNING:
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


  public addInfo(message: string) {
    this.addAlert(new Alert(message, Alert.INFO));
  }

  public addSuccess(message: string) {
    this.addAlert(new Alert(message, Alert.SUCCESS));
  }

  public addWarning(message: string) {
    this.addAlert(new Alert(message, Alert.WARNING));
  }

  public addDanger(message: string) {
    this.addAlert(new Alert(message, Alert.DANGER));
  }

  public addDebug(message: string) {
    this.addAlert(new Alert(message, Alert.DEBUG));
  }
}
