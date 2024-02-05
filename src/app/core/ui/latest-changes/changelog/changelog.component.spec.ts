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

import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChangelogComponent } from "./changelog.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LatestChangesService } from "../latest-changes.service";
import { Changelog } from "../changelog";
import { of } from "rxjs";
import { SwUpdate } from "@angular/service-worker";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ComponentRegistry } from "../../../../dynamic-components";
import { LatestChangesModule } from "../latest-changes.module";
import { UpdateManagerService } from "../update-manager.service";

describe("ChangelogComponent", () => {
  let component: ChangelogComponent;
  let fixture: ComponentFixture<ChangelogComponent>;

  let mockLatestChangesService: jasmine.SpyObj<LatestChangesService>;

  const testChangelog = new Changelog();
  testChangelog.tag_name = "1.0.0";
  testChangelog.name = "test name";
  testChangelog.body = "test changes body";
  testChangelog.published_at = "2018-01-01";

  beforeEach(waitForAsync(() => {
    mockLatestChangesService = jasmine.createSpyObj([
      "getChangelogsBeforeVersion",
      "getChangelogsBetweenVersions",
    ]);

    TestBed.configureTestingModule({
      imports: [
        LatestChangesModule,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        {
          provide: UpdateManagerService,
          useValue: jasmine.createSpyObj([
            "listenToAppUpdates",
            "regularlyCheckForUpdates",
            "detectUnrecoverableState",
          ]),
        },
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: of([testChangelog]) },
        { provide: LatestChangesService, useValue: mockLatestChangesService },
        { provide: SwUpdate, useValue: {} },
        ComponentRegistry,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangelogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
    expect(component.changelogs).toEqual([testChangelog]);
  });

  it("should add release info to end of array on 'show previous'", () => {
    mockLatestChangesService.getChangelogsBeforeVersion.and.returnValue(
      of([testChangelog]),
    );
    component.loadPreviousRelease();

    expect(component.changelogs).toEqual([testChangelog, testChangelog]);
  });
});
