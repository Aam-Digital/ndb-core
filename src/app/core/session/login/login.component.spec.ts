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

import { LoginComponent } from "./login.component";
import { LoginState } from "../session-states/login-state.enum";
import { ActivatedRoute, Router } from "@angular/router";
import { LoginStateSubject, SessionType } from "../session-type";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SessionManagerService } from "../session-service/session-manager.service";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { SessionInfo } from "../auth/session-info";
import { environment } from "../../../../environments/environment";
import type { Mock } from "vitest";

type KeycloakAuthServiceMock = Pick<
  KeycloakAuthService,
  "login" | "checkSession"
> & {
  login: Mock<KeycloakAuthService["login"]>;
  checkSession: Mock<KeycloakAuthService["checkSession"]>;
};

describe("LoginComponent", () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginState: LoginStateSubject;
  let mockKeycloak: KeycloakAuthServiceMock;
  let sessionManager: SessionManagerService;

  beforeEach(waitForAsync(() => {
    mockKeycloak = {
      login: vi.fn(),
      checkSession: vi.fn().mockResolvedValue(null),
    };
    TestBed.configureTestingModule({
      imports: [LoginComponent, MockedTestingModule.withState()],
      providers: [{ provide: KeycloakAuthService, useValue: mockKeycloak }],
    }).compileComponents();
    sessionManager = TestBed.inject(SessionManagerService);
    vi.spyOn(sessionManager, "checkRemoteSession").mockResolvedValue(undefined);
    vi.spyOn(sessionManager, "remoteLogin").mockResolvedValue(undefined);
    vi.spyOn(sessionManager, "remoteLoginAvailable").mockReturnValue(true);
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

  it("should try to check session on startup", () => {
    expect(sessionManager.checkRemoteSession).toHaveBeenCalled();
  });

  it("should route to redirect uri once state changes to 'logged-in'", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("location", { origin: "http://localhost" });
    try {
      const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigateByUrl");
      TestBed.inject(ActivatedRoute).snapshot.queryParams = {
        redirect_uri: "someUrl",
      };

      fixture.detectChanges();
      loginState.next(LoginState.LOGGED_IN);
      await vi.advanceTimersByTimeAsync(100);

      expect(navigateSpy).toHaveBeenCalledWith("/someUrl");
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it("should show offline login if remote login fails", async () => {
    vi.useFakeTimers();
    try {
      const mockUsers: SessionInfo[] = [{ name: "test", id: "101", roles: [] }];
      vi.spyOn(sessionManager, "getOfflineUsers").mockReturnValue(mockUsers);
      loginState.next(LoginState.LOGGED_OUT);
      fixture.detectChanges();

      loginState.next(LoginState.IN_PROGRESS);
      expect(component.enableOfflineLogin).toBe(false);
      expect(loginState.value).toBe(LoginState.IN_PROGRESS);

      loginState.next(LoginState.LOGIN_FAILED);
      await vi.advanceTimersByTimeAsync(0);
      expect(component.enableOfflineLogin).toBe(true);
      expect(component.offlineUsers).toEqual(mockUsers);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should show offline login after 5 seconds", async () => {
    vi.useFakeTimers();
    const mockUsers: SessionInfo[] = [{ name: "test", id: "101", roles: [] }];
    try {
      vi.spyOn(sessionManager, "getOfflineUsers").mockReturnValue(mockUsers);

      loginState.next(LoginState.LOGGED_OUT);
      fixture.detectChanges();
      loginState.next(LoginState.IN_PROGRESS);
      expect(component.enableOfflineLogin).toBe(false);

      await vi.advanceTimersByTimeAsync(10000);
      await fixture.whenStable();
      expect(component.enableOfflineLogin).toBe(true);
      expect(component.offlineUsers).toEqual(mockUsers);
    } finally {
      vi.useRealTimers();
    }
  });
});
