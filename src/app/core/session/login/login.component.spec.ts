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

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should try to check session on startup", () => {
    expect(sessionManager.checkRemoteSession).toHaveBeenCalled();
  });

  it("should route to redirect uri once state changes to 'logged-in'", () => {
    vi.stubGlobal("location", { origin: "http://localhost" });
    try {
      const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigateByUrl");
      TestBed.inject(ActivatedRoute).snapshot.queryParams = {
        redirect_uri: "someUrl",
      };

      fixture.detectChanges();
      loginState.next(LoginState.LOGGED_IN);

      expect(navigateSpy).toHaveBeenCalledWith("/someUrl");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("should show offline login after SSO check completes without session", async () => {
    const mockUsers: SessionInfo[] = [{ name: "test", id: "101", roles: [] }];
    vi.spyOn(sessionManager, "getOfflineUsers").mockResolvedValue(mockUsers);
    fixture.detectChanges();
    await fixture.whenStable();

    // SSO check resolved immediately in the constructor (mock returns resolved promise),
    // so enableOfflineLogin is already true.
    expect(component.enableOfflineLogin()).toBe(true);
    expect(component.showOfflineSection()).toBe(true);
    expect(component.offlineUsers).toEqual(mockUsers);
  });

  it("should show offline login after 10 seconds", async () => {
    vi.useFakeTimers();
    try {
      // Use a never-resolving promise so only the timer fires
      vi.spyOn(sessionManager, "checkRemoteSession").mockReturnValue(
        new Promise(() => {}),
      );
      const mockUsers: SessionInfo[] = [{ name: "test", id: "101", roles: [] }];
      vi.spyOn(sessionManager, "getOfflineUsers").mockResolvedValue(mockUsers);

      // Recreate component after fake timers so timer(10000) is captured
      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.enableOfflineLogin()).toBe(false);
      expect(component.showOfflineSection()).toBe(false);

      await vi.advanceTimersByTimeAsync(10000);
      expect(component.enableOfflineLogin()).toBe(true);
      expect(component.showOfflineSection()).toBe(true);
      expect(component.offlineUsers).toEqual(mockUsers);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should reveal the 'Log in' button after the silent SSO check resolves (OnPush)", async () => {
    // Override the mock with a deferred promise so we can observe the
    // pre-resolution state before allowing the silent SSO check to complete.
    let resolveSsoCheck: () => void;
    const ssoCheckPromise = new Promise<void>((res) => {
      resolveSsoCheck = res;
    });
    vi.spyOn(sessionManager, "checkRemoteSession").mockReturnValue(
      ssoCheckPromise,
    );

    // Re-create the component after re-mocking so the new promise is used.
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // While the silent check is pending: spinner shown, no button.
    expect(component.ssoCheckDone()).toBe(false);
    expect(
      fixture.nativeElement.querySelector("button[mat-flat-button]"),
    ).toBeFalsy();

    // Resolve the silent check and let the .finally callback run.
    resolveSsoCheck!();
    await ssoCheckPromise;
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.ssoCheckDone()).toBe(true);
    const loginButton = fixture.nativeElement.querySelector(
      "button[mat-flat-button]",
    );
    expect(loginButton).toBeTruthy();
    expect(loginButton.textContent).toContain("Log in");
  });

  it("should keep the spinner state in sync with login state changes (OnPush)", () => {
    fixture.detectChanges();

    loginState.next(LoginState.IN_PROGRESS);
    fixture.detectChanges();
    expect(component.loginInProgress()).toBe(true);
    expect(
      fixture.nativeElement.querySelector(".login-check-progressbar"),
    ).toBeTruthy();

    loginState.next(LoginState.LOGGED_OUT);
    fixture.detectChanges();
    expect(component.loginInProgress()).toBe(false);
    expect(
      fixture.nativeElement.querySelector(".login-check-progressbar"),
    ).toBeFalsy();
  });

  it("should NOT show an error after the silent SSO check completes without session", () => {
    fixture.detectChanges();

    // Simulate the initial silent SSO check transitioning to LOGGED_OUT
    // (the normal "you are not yet logged in" path).
    loginState.next(LoginState.IN_PROGRESS);
    loginState.next(LoginState.LOGGED_OUT);
    fixture.detectChanges();

    expect(component.loginError()).toBeNull();
    expect(fixture.nativeElement.querySelector(".login-error")).toBeFalsy();
  });

  it("should show an error message when a user-initiated remote login fails", () => {
    fixture.detectChanges();

    component.tryLogin();
    loginState.next(LoginState.IN_PROGRESS);
    loginState.next(LoginState.LOGIN_FAILED);
    fixture.detectChanges();

    expect(component.loginError()).toBeTruthy();
    const errorEl = fixture.nativeElement.querySelector(".login-error");
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain("login service");
  });

  it("should clear the error when the user retries", () => {
    fixture.detectChanges();
    component.tryLogin();
    loginState.next(LoginState.IN_PROGRESS);
    loginState.next(LoginState.LOGIN_FAILED);
    fixture.detectChanges();
    expect(component.loginError()).toBeTruthy();

    component.tryLogin();
    fixture.detectChanges();

    expect(component.loginError()).toBeNull();
    expect(fixture.nativeElement.querySelector(".login-error")).toBeFalsy();
  });
});
