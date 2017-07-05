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

import { TestBed, inject } from '@angular/core/testing';

import { AlertService } from './alert.service';
import { Alert } from './alert';

describe('AlertService', () => {
  let alertService: AlertService;

  beforeEach(() => {
    alertService = new AlertService();
  });

  it('add info alert', function () {
    const message = 'info alert';
    alertService.addInfo(message);

    expect(alertService.alerts[0].message).toEqual(message);
    expect(alertService.alerts[0].type).toEqual('info');
  });

  it('add success alert', function () {
    const message = 'success alert';
    alertService.addSuccess(message);

    expect(alertService.alerts[0].message).toEqual(message);
    expect(alertService.alerts[0].type).toEqual('success');
  });

  it('add warning alert', function () {
    const message = 'warning alert';
    alertService.addWarning(message);

    expect(alertService.alerts[0].message).toEqual(message);
    expect(alertService.alerts[0].type).toEqual('warning');
  });

  it('add danger alert', function () {
    const message = 'danger alert';
    alertService.addDanger(message);

    expect(alertService.alerts[0].message).toEqual(message);
    expect(alertService.alerts[0].type).toEqual('danger');
  });

  it('removes alert', function () {
    const alert = new Alert('test message', Alert.DANGER);
    alertService.addAlert(alert);
    alertService.removeAlert(alert);

    expect(alertService.alerts.length).toBe(0);
  });
});
