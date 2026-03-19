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

import { TestBed } from "@angular/core/testing";

import { LatestChangesService } from "./latest-changes.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LatestChangesDialogService } from "./latest-changes-dialog.service";
import { environment } from "../../../../environments/environment";
import { NEVER, of } from "rxjs";
import type { Mock } from "vitest";

type LatestChangesServiceMock = Pick<
  LatestChangesService,
  "getChangelogsBeforeVersion" | "getChangelogsBetweenVersions"
> & {
  getChangelogsBeforeVersion: Mock;
  getChangelogsBetweenVersions: Mock;
};

type LatestChangesDialogRefMock<T> = Pick<MatDialogRef<T>, "afterClosed"> & {
  afterClosed: () => ReturnType<typeof of>;
};

type MatDialogMock = Pick<MatDialog, "open"> & {
  open: Mock;
};

describe("LatestChangesDialogService", () => {
  let service: LatestChangesDialogService;
  let mockLatestChangesService: LatestChangesServiceMock;
  let mockDialog: MatDialogMock;

  beforeEach(() => {
    mockLatestChangesService = {
      getChangelogsBeforeVersion: vi.fn(),
      getChangelogsBetweenVersions: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockName("mockDialog.open"),
    };
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(NEVER),
    } as LatestChangesDialogRefMock<void>);

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
    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    service.showLatestChangesIfUpdated();

    expect(mockDialog.open).not.toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
  });

  it("should display changes if stored version differs", () => {
    const getSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValue("1.0-test");

    service.showLatestChangesIfUpdated();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
  });

  it("should not display changes if stored version matches", () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(
      environment.appVersion,
    );

    service.showLatestChangesIfUpdated();

    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it("should update stored version after user closes dialog", async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(Storage.prototype, "setItem");

      mockDialog.open.mockReturnValue({
        afterClosed: () => of(true),
      } as LatestChangesDialogRefMock<boolean>);

      service.showLatestChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        LatestChangesDialogService.VERSION_KEY,
        environment.appVersion,
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
