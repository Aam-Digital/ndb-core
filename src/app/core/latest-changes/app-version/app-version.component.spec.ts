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

import { AppVersionComponent } from "./app-version.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { LatestChangesDialogService } from "../latest-changes-dialog.service";

describe("AppVersionComponent", () => {
  let component: AppVersionComponent;
  let fixture: ComponentFixture<AppVersionComponent>;

  let latestChangesDialogService: jasmine.SpyObj<LatestChangesDialogService>;

  beforeEach(waitForAsync(() => {
    latestChangesDialogService = jasmine.createSpyObj([
      "getCurrentVersion",
      "showLatestChanges",
    ]);

    TestBed.configureTestingModule({
      imports: [AppVersionComponent, NoopAnimationsModule],
      providers: [
        {
          provide: LatestChangesDialogService,
          useValue: latestChangesDialogService,
        },
      ],
    });

    TestBed.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should load currentVersion", () => {
    const testVersion = "1.9.9";
    latestChangesDialogService.getCurrentVersion.and.returnValue(testVersion);

    component.ngOnInit();

    expect(component.currentVersion).toEqual(testVersion);
  });

  it("should open dialog", () => {
    component.showLatestChanges();
    expect(latestChangesDialogService.showLatestChanges).toHaveBeenCalled();
  });
});
