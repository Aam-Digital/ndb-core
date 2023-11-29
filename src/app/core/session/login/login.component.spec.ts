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
import { LoginState } from "../session-states/login-state.enum";
import { ActivatedRoute, Router } from "@angular/router";
import { LoginStateSubject, SessionType } from "../session-type";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SessionManagerService } from "../session-service/session-manager.service";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { firstValueFrom, Subject } from "rxjs";
import { AuthUser } from "../auth/auth-user";
import { environment } from "../../../../environments/environment";

describe("LoginComponent", () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginState: LoginStateSubject;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent, MockedTestingModule.withState()],
    }).compileComponents();
    loginState = TestBed.inject(LoginStateSubject);
    environment.session_type = SessionType.synced;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    environment.session_type = SessionType.mock;
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should route to redirect uri once state changes to 'logged-in'", () => {
    const navigateSpy = spyOn(TestBed.inject(Router), "navigateByUrl");
    TestBed.inject(ActivatedRoute).snapshot.queryParams = {
      redirect_uri: "someUrl",
    };

    fixture.detectChanges();
    loginState.next(LoginState.LOGGED_IN);

    expect(navigateSpy).toHaveBeenCalledWith("someUrl");
  });

  it("should show offline login if remote login fails", fakeAsync(() => {
    const sessionManager = TestBed.inject(SessionManagerService);
    const mockUsers = [{ name: "test", roles: [] }];
    spyOn(sessionManager, "getOfflineUsers").and.returnValue(mockUsers);
    spyOn(sessionManager, "remoteLoginAvailable").and.returnValue(true);
    const remoteLoginSubject = new Subject<AuthUser>();
    spyOn(TestBed.inject(KeycloakAuthService), "login").and.returnValue(
      firstValueFrom(remoteLoginSubject),
    );
    loginState.next(LoginState.LOGGED_OUT);
    fixture.detectChanges();

    sessionManager.remoteLogin().catch(() => undefined);
    expect(component.enableOfflineLogin).toBeFalse();
    expect(loginState.value).toBe(LoginState.IN_PROGRESS);

    remoteLoginSubject.error("login error");
    tick();
    expect(component.enableOfflineLogin).toBeTrue();
    expect(component.offlineUsers).toEqual(mockUsers);
  }));

  it("should show offline login after 5 seconds", fakeAsync(() => {
    const sessionManager = TestBed.inject(SessionManagerService);
    const mockUsers = [{ name: "test", roles: [] }];
    spyOn(sessionManager, "getOfflineUsers").and.returnValue(mockUsers);

    loginState.next(LoginState.LOGGED_OUT);
    fixture.detectChanges();
    loginState.next(LoginState.IN_PROGRESS);
    expect(component.enableOfflineLogin).toBeFalse();

    tick(10000);
    expect(component.enableOfflineLogin).toBeTrue();
    expect(component.offlineUsers).toEqual(mockUsers);
  }));
});
