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

import { SyncedSessionService } from "./synced-session.service";
import { LoginState } from "../session-states/login-state.enum";
import { LocalSession } from "./local-session";
import { RemoteSession } from "./remote-session";
import { SessionType } from "../session-type";
import { fakeAsync, flush, TestBed, tick } from "@angular/core/testing";
import { HttpErrorResponse, HttpStatusCode } from "@angular/common/http";
import {
  MockedTestingModule,
  TEST_PASSWORD,
  TEST_USER,
} from "../../../utils/mocked-testing.module";
import { testSessionServiceImplementation } from "./session.service.spec";
import { PouchDatabase } from "../../database/pouch-database";
import { SessionModule } from "../session.module";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { environment } from "../../../../environments/environment";
import { AuthService } from "../auth/auth.service";
import { AuthUser } from "./auth-user";
import { mockAuth } from "./remote-session.spec";

describe("SyncedSessionService", () => {
  let sessionService: SyncedSessionService;
  let localSession: LocalSession;
  let remoteSession: RemoteSession;
  let localLoginSpy: jasmine.Spy<
    (username: string, password: string) => Promise<LoginState>
  >;
  let remoteLoginSpy: jasmine.Spy<
    (username: string, password: string) => Promise<LoginState>
  >;
  let dbUser: AuthUser;
  let syncSpy: jasmine.Spy<() => Promise<void>>;
  let liveSyncSpy: jasmine.Spy<() => any>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockLocation: jasmine.SpyObj<Location>;

  beforeEach(() => {
    mockLocation = jasmine.createSpyObj(["reload"]);
    mockAuthService = jasmine.createSpyObj([
      "authenticate",
      "autoLogin",
      "logout",
    ]);
    mockAuthService.autoLogin.and.rejectWith();

    TestBed.configureTestingModule({
      imports: [SessionModule, MockedTestingModule],
      providers: [
        PouchDatabase,
        { provide: AuthService, useValue: mockAuthService },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
      ],
    });
    environment.session_type = SessionType.mock;
    sessionService = TestBed.inject(SyncedSessionService);

    localSession = TestBed.inject(LocalSession);
    remoteSession = TestBed.inject(RemoteSession);

    // Setting up local and remote session to accept TEST_USER and TEST_PASSWORD as valid credentials
    dbUser = { name: TEST_USER, roles: ["user_app"] };
    localSession.saveUser({ name: TEST_USER, roles: [] }, TEST_PASSWORD);
    mockAuthService.authenticate.and.callFake(mockAuth(dbUser));

    localLoginSpy = spyOn(localSession, "login").and.callThrough();
    remoteLoginSpy = spyOn(remoteSession, "login").and.callThrough();
    syncSpy = spyOn(sessionService, "sync").and.resolveTo();
    liveSyncSpy = spyOn(sessionService, "liveSyncDeferred");
  });

  afterEach(() => {
    localSession.removeUser(TEST_USER);
  });

  it("Remote and local fail (normal login with wrong password)", fakeAsync(() => {
    const result = sessionService.login("anotherUser", "wrongPassword");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith("anotherUser", "wrongPassword");
    expect(remoteLoginSpy).toHaveBeenCalledWith("anotherUser", "wrongPassword");
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    flush();
  }));

  it("Remote unavailable, local succeeds (offline)", fakeAsync(() => {
    failRemoteLogin(true);

    const result = sessionService.login(TEST_USER, TEST_PASSWORD);
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);

    sessionService.cancelLoginOfflineRetry();
    flush();
  }));

  it("Remote unavailable, local fails (offline, wrong password)", fakeAsync(() => {
    failRemoteLogin(true);

    const result = sessionService.login(TEST_USER, "wrongPassword");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, "wrongPassword");
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, "wrongPassword");
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    tick();
  }));

  it("Remote succeeds, local fails (password changed and new password entered/new user)", fakeAsync(() => {
    const newUser = { name: "newUser", roles: ["user_app"] };
    passRemoteLogin(newUser);
    spyOn(localSession, "saveUser").and.callThrough();

    const result = sessionService.login(newUser.name, "p");
    tick();

    expect(localLoginSpy.calls.allArgs()).toEqual([
      [newUser.name, "p"],
      [newUser.name, "p"],
    ]);
    expect(remoteLoginSpy.calls.allArgs()).toEqual([[newUser.name, "p"]]);
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(liveSyncSpy).toHaveBeenCalledTimes(1);
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    expect(localSession.saveUser).toHaveBeenCalledWith(
      {
        name: newUser.name,
        roles: newUser.roles,
      },
      "p",
      newUser.name
    );
    expect(sessionService.getCurrentUser().name).toBe("newUser");
    expect(sessionService.getCurrentUser().roles).toEqual(["user_app"]);
    tick();
    localSession.removeUser(newUser.name);
  }));

  it("Remote fails, local succeeds (Password changes, old password entered)", fakeAsync(() => {
    failRemoteLogin();
    spyOn(localSession, "removeUser").and.callThrough();

    const result = sessionService.login(TEST_USER, TEST_PASSWORD);
    tick();

    // The local user is removed to prohibit further offline login
    expect(localSession.removeUser).toHaveBeenCalledWith(TEST_USER);
    // Initially the user is logged in
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    // After remote session fails the user is logged out again
    expect(sessionService.loginState.value).toBe(LoginState.LOGGED_OUT);
    flush();
  }));

  it("Remote and local succeed, sync fails", fakeAsync(() => {
    syncSpy.and.rejectWith();

    const login = sessionService.login(TEST_USER, TEST_PASSWORD);
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(syncSpy).toHaveBeenCalled();
    expect(liveSyncSpy).toHaveBeenCalled();
    expectAsync(login).toBeResolvedTo(LoginState.LOGGED_IN);

    // clear timeouts and intervals
    sessionService.logout();
    flush();
  }));

  it("remote and local unavailable", fakeAsync(() => {
    failRemoteLogin(true);

    const result = sessionService.login("anotherUser", "anotherPassword");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(
      "anotherUser",
      "anotherPassword"
    );
    expect(remoteLoginSpy).toHaveBeenCalledWith(
      "anotherUser",
      "anotherPassword"
    );
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.UNAVAILABLE);

    flush();
  }));

  it("should update the local user object once connected", fakeAsync(() => {
    const updatedUser: AuthUser = {
      name: TEST_USER,
      roles: dbUser.roles.concat("admin"),
    };
    passRemoteLogin(updatedUser);

    const result = sessionService.login(TEST_USER, TEST_PASSWORD);
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(remoteLoginSpy).toHaveBeenCalledWith(TEST_USER, TEST_PASSWORD);
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(liveSyncSpy).toHaveBeenCalledTimes(1);

    const currentUser = localSession.getCurrentUser();
    expect(currentUser.name).toEqual(TEST_USER);
    expect(currentUser.roles).toEqual(["user_app", "admin"]);
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    tick();
  }));

  it("should login, if the session is still valid", fakeAsync(() => {
    mockAuthService.autoLogin.and.resolveTo(dbUser);

    sessionService.checkForValidSession();
    tick();
    expect(sessionService.loginState.value).toEqual(LoginState.LOGGED_IN);
  }));

  it("should support email instead of username for login", async () => {
    const newUser: AuthUser = { name: "test-user", roles: ["test-role"] };
    passRemoteLogin(newUser);

    const res = await sessionService.login("my@email.com", "test-pass");

    expect(res).toBe(LoginState.LOGGED_IN);
    expect(JSON.parse(localStorage.getItem("test-user"))).toEqual(
      jasmine.objectContaining(newUser)
    );
    expect(JSON.parse(localStorage.getItem("my@email.com"))).toEqual(
      jasmine.objectContaining(newUser)
    );

    localStorage.removeItem("test-user");
    localStorage.removeItem("my@email.com");
  });

  it("should correctly check the password", () => {
    localSession.saveUser({ name: "TestUser", roles: [] }, TEST_PASSWORD);

    expect(sessionService.checkPassword("TestUser", TEST_PASSWORD)).toBeTrue();
    expect(sessionService.checkPassword("TestUser", "wrongPW")).toBeFalse();
  });

  it("should restart the sync if it fails at one point", fakeAsync(() => {
    let errorCallback, pauseCallback;
    const syncHandle = {
      on: (action, callback) => {
        if (action === "error") {
          errorCallback = callback;
        }
        if (action === "paused") {
          pauseCallback = callback;
        }
        return syncHandle;
      },
      cancel: () => undefined,
    };
    syncSpy = jasmine.createSpy().and.returnValue(syncHandle);
    liveSyncSpy.and.callThrough();
    spyOn(localSession, "getDatabase").and.returnValue({
      getPouchDB: () => ({ sync: syncSpy }),
    } as any);

    passRemoteLogin();
    sessionService.login(TEST_USER, TEST_PASSWORD);
    flush();

    // error -> sync should restart
    syncSpy.calls.reset();
    errorCallback();
    expect(syncSpy).toHaveBeenCalled();

    // pause -> no restart required
    syncSpy.calls.reset();
    pauseCallback();
    expect(syncSpy).not.toHaveBeenCalled();

    // logout + error -> no restart
    syncSpy.calls.reset();
    sessionService.logout();
    tick();
    errorCallback();
    expect(syncSpy).not.toHaveBeenCalled();
  }));

  testSessionServiceImplementation(() => Promise.resolve(sessionService));

  function passRemoteLogin(response: AuthUser = { name: "", roles: [] }) {
    mockAuthService.authenticate.and.resolveTo(response);
  }

  function failRemoteLogin(offline = false) {
    let rejectError;
    if (!offline) {
      rejectError = new HttpErrorResponse({
        status: HttpStatusCode.Unauthorized,
      });
    }
    mockAuthService.authenticate.and.rejectWith(rejectError);
  }
});
