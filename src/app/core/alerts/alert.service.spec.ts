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
import { TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatSnackBarModule } from "@angular/material/snack-bar";

describe("AlertService", () => {
  let service: AlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, MatSnackBarModule],
    });
    service = TestBed.inject(AlertService);
  });

  it("adds an info alert", function () {
    const message = "info alert";
    service.addInfo(message);

    expect(service.alerts[0].message).toEqual(message);
    expect(service.alerts[0].type).toEqual("info");
  });

  it("adds a warning alert", function () {
    const message = "warning alert";
    service.addWarning(message);

    expect(service.alerts[0].message).toEqual(message);
    expect(service.alerts[0].type).toEqual("warning");
  });

  it("adds a danger alert", function () {
    const message = "danger alert";
    service.addDanger(message);

    expect(service.alerts[0].message).toEqual(message);
    expect(service.alerts[0].type).toEqual("danger");
  });
});
