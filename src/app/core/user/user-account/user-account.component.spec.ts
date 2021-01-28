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

import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { UserAccountComponent } from "./user-account.component";
import { SessionService } from "../../session/session-service/session.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { Database } from "../../database/database";
import { MockDatabase } from "../../database/mock-database";
import { User } from "../user";
import { AppConfig } from "../../app-config/app-config";
import { UserAccountService } from "./user-account.service";
import { UserModule } from "../user.module";

describe("UserAccountComponent", () => {
  let component: UserAccountComponent;
  let fixture: ComponentFixture<UserAccountComponent>;

  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockUserAccountService: jasmine.SpyObj<UserAccountService>;
  const testUser = new User("");

  beforeEach(async(() => {
    // @ts-ignore
    AppConfig.settings = { database: { useTemporaryDatabase: false } };
    mockSessionService = jasmine.createSpyObj("sessionService", [
      "getCurrentUser",
    ]);
    mockSessionService.getCurrentUser.and.returnValue(testUser);
    mockEntityMapper = jasmine.createSpyObj(["save"]);
    mockUserAccountService = jasmine.createSpyObj("mockUserAccount", [
      "changePassword",
    ]);

    TestBed.configureTestingModule({
      declarations: [UserAccountComponent],
      imports: [UserModule, NoopAnimationsModule],
      providers: [
        { provide: Database, useClass: MockDatabase },
        { provide: SessionService, useValue: mockSessionService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: UserAccountService, useValue: mockUserAccountService },
      ],
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });
});
