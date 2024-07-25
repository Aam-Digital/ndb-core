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

import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { LatestChangesService } from "./latest-changes.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LatestChangesDialogService } from "./latest-changes-dialog.service";
import { environment } from "../../../../environments/environment";
import { NEVER, of } from "rxjs";

describe("LatestChangesDialogService", () => {
  let service: LatestChangesDialogService;
  let mockLatestChangesService: jasmine.SpyObj<LatestChangesService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    mockLatestChangesService = jasmine.createSpyObj([
      "getLatestChangesBeforeVersion",
      "getChangelogsBetweenVersions",
    ]);

    mockDialog = jasmine.createSpyObj("mockDialog", ["open"]);
    mockDialog.open.and.returnValue({
      afterClosed: () => of(NEVER),
    } as MatDialogRef<void>);

    TestBed.configureTestingModule({
      providers: [
        LatestChangesDialogService,
        { provide: LatestChangesService, useValue: mockLatestChangesService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    });

    service = TestBed.inject<LatestChangesDialogService>(
      LatestChangesDialogService,
    );
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should not display changes on first visit (no version)", () => {
    const getSpy = spyOn(Storage.prototype, "getItem").and.returnValue(null);

    service.showLatestChangesIfUpdated();

    expect(mockDialog.open).not.toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
  });

  it("should display changes if stored version differs", () => {
    const getSpy = spyOn(Storage.prototype, "getItem").and.returnValue(
      "1.0-test",
    );

    service.showLatestChangesIfUpdated();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
  });

  it("should not display changes if stored version matches", () => {
    spyOn(Storage.prototype, "getItem").and.returnValue(environment.appVersion);

    service.showLatestChangesIfUpdated();

    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it("should update stored version after user closes dialog", fakeAsync(() => {
    spyOn(Storage.prototype, "setItem");

    mockDialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<boolean>);

    service.showLatestChanges();
    tick();

    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      LatestChangesDialogService.VERSION_KEY,
      environment.appVersion,
    );
  }));
});
