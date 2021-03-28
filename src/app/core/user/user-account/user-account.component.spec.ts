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

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

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
import { SessionType } from "../../session/session-type";
import { IAppConfig } from "../../app-config/app-config.model";

describe("UserAccountComponent", () => {
  let component: UserAccountComponent;
  let fixture: ComponentFixture<UserAccountComponent>;

  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockUserAccountService: jasmine.SpyObj<UserAccountService>;
  const testUser = new User("");

  beforeEach(
    waitForAsync(() => {
      AppConfig.settings = {
        session_type: SessionType.synced, // password change only available in synced mode
      } as IAppConfig;
      mockSessionService = jasmine.createSpyObj("sessionService", [
        "getCurrentUser",
        "login",
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
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should enable password form", () => {
    expect(component.passwordForm.enabled).toBeTrue();
  });

  it("should set error when password is incorrect", () => {
    const user = new User("TestUser");
    user.setNewPassword("testPW");
    component.user = user;
    component.passwordForm.get("currentPassword").setValue("wrongPW");
    expect(component.passwordForm.get("currentPassword").valid).toBeTrue();
    component.changePassword();
    expect(component.passwordForm.get("currentPassword").valid).toBeFalse();
  });

  it("should set error when password change fails", fakeAsync(() => {
    const user = new User("TestUser");
    user.setNewPassword("testPW");
    component.user = user;
    component.passwordForm.get("currentPassword").setValue("testPW");
    mockUserAccountService.changePassword.and.rejectWith(
      new Error("pw change error")
    );
    try {
      component.changePassword();
      tick();
    } catch (e) {
      // expected to re-throw the error for upstream reporting
    }
    expect(component.passwordChangeResult.success).toBeFalse();
    expect(component.passwordChangeResult.error).toBe("pw change error");
  }));

  it("should set success when password change worked", fakeAsync(() => {
    const user = new User("TestUser");
    user.setNewPassword("testPW");
    component.user = user;
    component.passwordForm.get("currentPassword").setValue("testPW");
    mockUserAccountService.changePassword.and.resolveTo(null);
    mockSessionService.login.and.resolveTo(null);
    component.changePassword();
    tick();
    tick();
    expect(component.passwordChangeResult.success).toBeTrue();
  }));
});
