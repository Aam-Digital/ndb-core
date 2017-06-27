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
