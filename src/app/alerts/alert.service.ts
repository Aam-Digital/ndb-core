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

@Injectable()
export class AlertService {

  alerts: Alert[] = [];

  constructor(public snackBar: MatSnackBar) {}

  addAlert(alert: Alert) {
    this.alerts.push(alert);
    this.openSnackBar(alert);
  }

  openSnackBar(alert: Alert) {
    const snackConfig = { data: alert, duration: 1800000, panelClass: 'alerts-snackbar' };
    if (alert.type === Alert.SUCCESS || alert.type === Alert.INFO) {
      snackConfig.duration = 5000;
    }
    alert.notificationRef = this.snackBar.openFromComponent(AlertComponent, snackConfig);
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
}
