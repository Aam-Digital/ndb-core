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

import { UiComponent } from "./ui.component";
import { SwUpdate } from "@angular/service-worker";
import { EMPTY, Subject } from "rxjs";
import { ConfigService } from "../../config/config.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";

describe("UiComponent", () => {
  let component: UiComponent;
  let fixture: ComponentFixture<UiComponent>;

  beforeEach(waitForAsync(() => {
    const mockSwUpdate = { available: EMPTY, checkForUpdate: () => {} };
    const mockIndexingService = jasmine.createSpyObj<DatabaseIndexingService>(
      ["createIndex"],
      {
        indicesRegistered: new Subject(),
      }
    );
    mockIndexingService.createIndex.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [UiComponent, MockedTestingModule.withState()],
      providers: [
        UserRoleGuard,
        { provide: SwUpdate, useValue: mockSwUpdate },
        {
          provide: DatabaseIndexingService,
          useValue: mockIndexingService,
        },
      ],
    }).compileComponents();

    const configService = TestBed.inject(ConfigService);
    configService.saveConfig({ navigationMenu: { items: [] } });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });
});
