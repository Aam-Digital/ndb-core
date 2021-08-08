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
import { AlertService } from "../../alerts/alert.service";
import { LoginState } from "../session-states/login-state.enum";
import { ConnectionState } from "../session-states/connection-state.enum";
import { AppConfig } from "../../app-config/app-config";
import { LocalSession } from "./local-session";
import { RemoteSession } from "./remote-session";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { SessionType } from "../session-type";
import { fakeAsync, flush, TestBed, tick } from "@angular/core/testing";
import { User } from "../../user/user";
import {
  HttpClient,
  HttpClientModule,
  HttpErrorResponse,
} from "@angular/common/http";
import { LoggingService } from "../../logging/logging.service";
import * as CryptoJS from "crypto-js";
import { of, throwError } from "rxjs";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DatabaseUser } from "./local-user";

describe("SyncedSessionService", () => {
  let sessionService: SyncedSessionService;
  let localSession: LocalSession;
  let remoteSession: RemoteSession;
  let localLoginSpy: jasmine.Spy<
    (username: string, password: string) => Promise<LoginState>
  >;
  let remoteLoginSpy: jasmine.Spy<
    (username: string, password: string) => Promise<ConnectionState>
  >;
  let syncSpy: jasmine.Spy<() => Promise<void>>;
  let liveSyncSpy: jasmine.Spy<() => void>;
  let loadUserSpy: jasmine.Spy<(userId: string) => void>;

  const username = "username";

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        EntitySchemaService,
        AlertService,
        LoggingService,
        SyncedSessionService,
      ],
    });
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.mock,
      database: {
        name: "integration_tests",
        remote_url: "https://demo.aam-digital.com/db/",
      },
      webdav: { remote_url: "" },
    };
    sessionService = TestBed.inject(SyncedSessionService);

    // make private members localSession and remoteSession available in the tests
    // @ts-ignore
    localSession = sessionService._localSession;
    // @ts-ignore
    remoteSession = sessionService._remoteSession;

    localLoginSpy = spyOn(localSession, "login").and.callThrough();
    remoteLoginSpy = spyOn(remoteSession, "login").and.callThrough();
    syncSpy = spyOn(sessionService, "sync").and.resolveTo();
    liveSyncSpy = spyOn(sessionService, "liveSyncDeferred");

    // TODO remove this once User Entity is not needed in session any more
    loadUserSpy = spyOn(localSession, "loadUser").and.resolveTo();
  });

  afterEach(() => {
    localSession.removeUser(username);
  });

  it("behaves correctly when both local and remote session reject (normal login with wrong password)", fakeAsync(() => {
    failLocalLogin();
    failRemoteLogin();

    const result = sessionService.login(username, "p");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(username, "p");
    expect(remoteLoginSpy).toHaveBeenCalledWith(username, "p");
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    flush();
  }));

  it("behaves correctly in the offline scenario", fakeAsync(() => {
    passLocalLogin();
    failRemoteLogin(true);

    const result = sessionService.login(username, "p");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(username, "p");
    expect(remoteLoginSpy).toHaveBeenCalledWith(username, "p");
    expect(syncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);

    sessionService.cancelLoginOfflineRetry();
    flush();
  }));

  it("behaves correctly when the local session rejects, but the remote session succeeds (password change, new password)", fakeAsync(() => {
    passLocalLoginOnSecondAttempt();
    passRemoteLogin();

    const result = sessionService.login(username, "p");
    tick();

    expect(localLoginSpy.calls.allArgs()).toEqual([
      [username, "p"],
      [username, "p"],
    ]);
    expect(remoteLoginSpy.calls.allArgs()).toEqual([[username, "p"]]);
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(liveSyncSpy).toHaveBeenCalledTimes(1);
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    tick();
  }));

  it("behaves correctly when the sync fails and the local login succeeds", fakeAsync(() => {
    passLocalLogin();
    passRemoteLogin();
    syncSpy.and.rejectWith();

    const login = sessionService.login(username, "p");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(username, "p");
    expect(remoteLoginSpy).toHaveBeenCalledWith(username, "p");
    expect(syncSpy).toHaveBeenCalled();
    expect(liveSyncSpy).toHaveBeenCalled();
    expectAsync(login).toBeResolvedTo(LoginState.LOGGED_IN);
    flush();
  }));

  it("behaves correctly when the sync fails and the local login fails", fakeAsync(() => {
    failLocalLogin();
    passRemoteLogin();
    syncSpy.and.rejectWith();

    const result = sessionService.login(username, "p");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(username, "p");
    expect(localLoginSpy).toHaveBeenCalledTimes(2);
    expect(remoteLoginSpy).toHaveBeenCalledWith(username, "p");
    expect(remoteLoginSpy).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalled();
    expect(liveSyncSpy).not.toHaveBeenCalled();
    expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    tick();
  }));

  it("should load the user entity after successful local login", fakeAsync(() => {
    const testUser = new User(username);
    testUser.name = username;
    const database = sessionService.getDatabase();
    loadUserSpy.and.callThrough();
    spyOn(database, "get").and.resolveTo(
      TestBed.inject(EntitySchemaService).transformEntityToDatabaseFormat(
        testUser
      )
    );
    passLocalLogin();
    passRemoteLogin();

    sessionService.login(username, "password");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(username, "password");
    expect(database.get).toHaveBeenCalledWith(testUser._id);
    expect(sessionService.getCurrentUser()).toEqual(testUser);
  }));

  it("should save the user locally after successful remote login", fakeAsync(() => {
    const dbUser: DatabaseUser = { name: username, roles: ["user_app"] };
    passRemoteLogin(dbUser);
    localLoginSpy.and.callThrough();
    spyOn(localSession, "saveUser").and.callThrough();

    const result = sessionService.login(username, "password");
    tick();

    expect(remoteLoginSpy).toHaveBeenCalledWith(username, "password");
    expect(localLoginSpy).toHaveBeenCalledWith(username, "password");
    expect(localLoginSpy).toHaveBeenCalledTimes(2);
    expect(localSession.saveUser).toHaveBeenCalledWith(
      {
        name: dbUser.name,
        roles: dbUser.roles,
      },
      "password"
    );
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    tick();
  }));

  it("should update the local user object once connected", fakeAsync(() => {
    const oldUser: DatabaseUser = {
      name: username,
      roles: ["user_app"],
    };
    localSession.saveUser(oldUser, "password");
    const newUser: DatabaseUser = {
      name: username,
      roles: oldUser.roles.concat("admin"),
    };
    passRemoteLogin(newUser);

    const result = sessionService.login(username, "password");
    tick();

    expect(localLoginSpy).toHaveBeenCalledWith(username, "password");
    expect(remoteLoginSpy).toHaveBeenCalledWith(username, "password");
    expect(syncSpy).toHaveBeenCalledTimes(1);
    expect(liveSyncSpy).toHaveBeenCalledTimes(1);
    const currentUser = localSession.getCurrentDBUser();
    expect(currentUser.name).toEqual(username);
    expect(currentUser.roles).toEqual(["user_app", "admin"]);
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    tick();
  }));

  it("should delete the local user object if remote login fails", fakeAsync(() => {
    localSession.saveUser({ name: username, roles: [] }, "password");
    failRemoteLogin();
    spyOn(localSession, "removeUser").and.callThrough();

    const result = sessionService.login(username, "password");
    tick();

    expect(localSession.removeUser).toHaveBeenCalledWith(username);
    // Initially the user is logged in
    expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    // After remote session fails the user is logged out again
    expect(sessionService.getLoginState().getState()).toBe(
      LoginState.LOGIN_FAILED
    );
    flush();
  }));
});

function failLocalLogin() {
  spyOn(window.localStorage, "getItem").and.returnValue(JSON.stringify(false));
}

function passLocalLogin() {
  spyOn(window.localStorage, "getItem").and.returnValue(
    JSON.stringify({ encryptedPassword: { hash: "password" } })
  );
  spyOn(CryptoJS, "PBKDF2").and.returnValue("password" as any);
}

function passRemoteLogin(response: DatabaseUser = { name: "", roles: [] }) {
  spyOn(TestBed.inject(HttpClient), "post").and.returnValue(of(response));
}

function failRemoteLogin(offline = false) {
  let rejectError;
  if (!offline) {
    rejectError = new HttpErrorResponse({ statusText: "Unauthorized" });
  }
  spyOn(TestBed.inject(HttpClient), "post").and.returnValue(
    throwError(rejectError)
  );
}

function passLocalLoginOnSecondAttempt() {
  spyOn(window.localStorage, "getItem").and.returnValues(
    JSON.stringify(false),
    JSON.stringify({ encryptedPassword: { hash: "password" } })
  );
  spyOn(CryptoJS, "PBKDF2").and.returnValue("password" as any);
}
