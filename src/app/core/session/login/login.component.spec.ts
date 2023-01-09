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

import { LoginComponent } from "./login.component";
import { LoggingService } from "../../logging/logging.service";
import { SessionService } from "../session-service/session.service";
import { LoginState } from "../session-states/login-state.enum";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { AuthService } from "../auth/auth.service";

describe("LoginComponent", () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(waitForAsync(() => {
    mockSessionService = jasmine.createSpyObj(["login"]);
    TestBed.configureTestingModule({
      imports: [LoginComponent, MockedTestingModule],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: AuthService, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should show a message when login is unavailable", fakeAsync(() => {
    expectErrorMessageOnState(LoginState.UNAVAILABLE);
  }));

  it("should show a message when login fails", fakeAsync(() => {
    expectErrorMessageOnState(LoginState.LOGIN_FAILED);
  }));

  it("should show a message and call logging service on unexpected login state", fakeAsync(() => {
    const loggerSpy = spyOn(TestBed.inject(LoggingService), "error");

    expectErrorMessageOnState(LoginState.LOGGED_OUT);
    expect(loggerSpy).toHaveBeenCalled();
  }));

  it("should show a message and call logging service on error", fakeAsync(() => {
    mockSessionService.login.and.rejectWith();
    expect(component.errorMessage).toBeFalsy();
    const loggerSpy = spyOn(TestBed.inject(LoggingService), "error");

    component.login();
    tick();
    expect(loggerSpy).toHaveBeenCalled();
    expect(component.errorMessage).toBeTruthy();
  }));

  it("should focus the first input element on initialization", fakeAsync(() => {
    component.ngAfterViewInit();
    tick();
    fixture.detectChanges();

    const firstInputElement = document.getElementsByTagName("input")[0];
    expect(document.activeElement).toBe(firstInputElement);
  }));

  function expectErrorMessageOnState(loginState: LoginState) {
    mockSessionService.login.and.resolveTo(loginState);
    expect(component.errorMessage).toBeFalsy();

    component.login();
    tick();

    expect(component.errorMessage).toBeTruthy();
  }
});
