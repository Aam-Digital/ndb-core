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
import { AppConfig } from "../../app-config/app-config";
import { UserAccountService } from "./user-account.service";
import { UserModule } from "../user.module";
import { SessionType } from "../../session/session-type";
import { LoggingService } from "../../logging/logging.service";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { RouterTestingModule } from "@angular/router/testing";

describe("UserAccountComponent", () => {
  let component: UserAccountComponent;
  let fixture: ComponentFixture<UserAccountComponent>;

  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockUserAccountService: jasmine.SpyObj<UserAccountService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(waitForAsync(() => {
    AppConfig.SESSION_TYPE = SessionType.synced; // password change only available in synced mode
    mockSessionService = jasmine.createSpyObj("sessionService", [
      "getCurrentUser",
      "login",
      "checkPassword",
    ]);
    mockSessionService.getCurrentUser.and.returnValue({
      name: "TestUser",
      roles: [],
    });
    mockUserAccountService = jasmine.createSpyObj("mockUserAccount", [
      "changePassword",
    ]);
    mockLoggingService = jasmine.createSpyObj(["error"]);

    TestBed.configureTestingModule({
      imports: [
        UserModule,
        NoopAnimationsModule,
        TabStateModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: UserAccountService, useValue: mockUserAccountService },
        { provide: LoggingService, useValue: mockLoggingService },
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

  it("should enable password form", () => {
    expect(component.passwordForm).toBeEnabled();
  });

  it("should set error when password is incorrect", () => {
    component.passwordForm.get("currentPassword").setValue("wrongPW");
    mockSessionService.checkPassword.and.returnValue(false);

    expect(component.passwordForm.get("currentPassword")).toBeValidForm();

    component.changePassword();

    expect(component.passwordForm.get("currentPassword")).not.toBeValidForm();
  });

  it("should set error when password change fails", fakeAsync(() => {
    component.username = "testUser";
    component.passwordForm.get("currentPassword").setValue("testPW");
    mockSessionService.checkPassword.and.returnValue(true);
    mockUserAccountService.changePassword.and.rejectWith(
      new Error("pw change error")
    );

    try {
      component.changePassword();
      tick();
    } catch (e) {
      // expected to re-throw the error for upstream reporting
    }

    expect(mockUserAccountService.changePassword).toHaveBeenCalled();
    expect(component.passwordChangeResult.success).toBeFalse();
    expect(component.passwordChangeResult.error).toBe("pw change error");
  }));

  it("should set success and re-login when password change worked", fakeAsync(() => {
    component.username = "testUser";
    component.passwordForm.get("currentPassword").setValue("testPW");
    component.passwordForm.get("newPassword").setValue("changedPassword");
    mockSessionService.checkPassword.and.returnValue(true);
    mockUserAccountService.changePassword.and.resolveTo();
    mockSessionService.login.and.resolveTo(null);

    component.changePassword();
    tick();
    expect(component.passwordChangeResult.success).toBeTrue();
    expect(mockSessionService.login).toHaveBeenCalledWith(
      "testUser",
      "changedPassword"
    );
  }));
});
