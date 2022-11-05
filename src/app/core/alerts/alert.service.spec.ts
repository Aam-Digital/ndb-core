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

import { AlertService } from "./alert.service";
import { Alert } from "./alert";
import { LogLevel } from "../logging/log-level";
import { LoggingService } from "../logging/logging.service";
import { AlertDisplay } from "./alert-display";
import { MatSnackBar } from "@angular/material/snack-bar";
import { of } from "rxjs";

class MockLoggingService extends LoggingService {
  public log(_message: string, _logLevel: LogLevel) {}

  public debug(_message: string) {}

  public info(_message: string) {}

  public warn(_message: string) {}

  public error(_message: string) {}
}

describe("AlertService", () => {
  let alertService: AlertService;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let loggingService: MockLoggingService;
  const dismissSpy = jasmine.createSpy();
  beforeEach(() => {
    loggingService = new MockLoggingService();
    snackBarMock = jasmine.createSpyObj(["openFromComponent"]);
    snackBarMock.openFromComponent.and.returnValue({
      dismiss: dismissSpy,
    } as any);
    alertService = new AlertService(snackBarMock);
  });

  it("add info alert", function () {
    const message = "info alert";
    alertService.addInfo(message);

    expect(alertService.alerts[0].message).toEqual(message);
    expect(alertService.alerts[0].type).toEqual("info");
  });

  it("add warning alert", function () {
    const message = "warning alert";
    alertService.addWarning(message);

    expect(alertService.alerts[0].message).toEqual(message);
    expect(alertService.alerts[0].type).toEqual("warning");
  });

  it("add danger alert", function () {
    const message = "danger alert";
    alertService.addDanger(message);

    expect(alertService.alerts[0].message).toEqual(message);
    expect(alertService.alerts[0].type).toEqual("danger");
  });

  it("removes alert", function () {
    const alert = new Alert(
      "test message",
      Alert.DANGER,
      AlertDisplay.PERSISTENT
    );
    alertService.addAlert(alert);
    alertService.removeAlert(alert);

    expect(alertService.alerts).toBeEmpty();
    expect(dismissSpy).toHaveBeenCalled();
  });

  it("should create an alert with the progress observable", () => {
    const progress = of(1, 2, 3);

    const alert = alertService.addProgress("progress", progress);

    expect(alert.progress).toBe(progress);
    expect(alertService.alerts[0]).toBe(alert);
  });
});
