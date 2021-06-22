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
import { SyncState } from "../session-states/sync-state.enum";
import { ConnectionState } from "../session-states/connection-state.enum";
import { AppConfig } from "../../app-config/app-config";
import { LocalSession } from "./local-session";
import { RemoteSession } from "./remote-session";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { SessionType } from "../session-type";
import { fakeAsync, tick } from "@angular/core/testing";
import { failOnStates, waitForChangeTo } from "./session-utils";

describe("SyncedSessionService", () => {
  const snackBarMock = { openFromComponent: () => {} } as any;
  const alertService = new AlertService(snackBarMock);
  const entitySchemaService = new EntitySchemaService();
  let sessionService: SyncedSessionService;

  xdescribe("Integration Tests", () => {
    let originalTimeout;

    beforeEach(function () {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    afterEach(function () {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    beforeEach(() => {
      AppConfig.settings = {
        site_name: "Aam Digital - DEV",
        session_type: SessionType.synced,
        database: {
          name: "integration_tests",
          remote_url: "https://demo.aam-digital.com/db/",
        },
      };
      sessionService = new SyncedSessionService(
        alertService,
        jasmine.createSpyObj(["error", "warn"]),
        entitySchemaService
      );
    });

    it("has the correct Initial State", () => {
      expect(sessionService.loginState).toEqual(LoginState.LOGGED_OUT);
      expect(sessionService.syncState).toEqual(SyncState.UNSYNCED);
      expect(sessionService.connectionState).toEqual(
        ConnectionState.DISCONNECTED
      );

      expect(sessionService.isLoggedIn()).toEqual(false);
      expect(sessionService.getCurrentUser()).not.toBeDefined();
    });

    async function expectFailLogin(loginState: LoginState) {
      expect(loginState).toEqual(LoginState.LOGIN_FAILED);
      expect(sessionService.loginState).toEqual(LoginState.LOGIN_FAILED);
      expect(sessionService.syncState).toEqual(SyncState.UNSYNCED);

      // remote session takes a bit longer than a local login - this throws on successful connection
      await sessionService.connectionStateStream
        .pipe(
          failOnStates([ConnectionState.CONNECTED]),
          waitForChangeTo(ConnectionState.REJECTED, true)
        )
        .toPromise();

      expect(sessionService.isLoggedIn()).toEqual(false);
      expect(sessionService.getCurrentUser()).not.toBeDefined();
    }

    it("has the correct state after Login with wrong credentials", async () => {
      const loginState = await sessionService.login("demo", "pass123");
      await expectFailLogin(loginState);
    });

    it("has the correct state after Login with non-existing user", async () => {
      const loginState = await sessionService.login("demo123", "pass123");
      await expectFailLogin(loginState);
    });

    it("has the correct state after Login with correct credentials", async () => {
      const [loginState] = await Promise.all([
        sessionService.login("demo", "pass"),
        sessionService.syncStateStream
          .pipe(
            failOnStates([SyncState.FAILED]),
            waitForChangeTo(SyncState.COMPLETED)
          )
          .toPromise(),
      ]);
      expect(loginState).toEqual(LoginState.LOGGED_IN);
      expect(sessionService.loginState).toEqual(LoginState.LOGGED_IN);
      expect(sessionService.syncState).toEqual(SyncState.COMPLETED);
      expect(sessionService.connectionState).toEqual(ConnectionState.CONNECTED);

      expect(sessionService.isLoggedIn()).toEqual(true);
      expect(sessionService.getCurrentUser()).toBeDefined();
    });

    it("has the correct state after Logout", async () => {
      await Promise.all([
        sessionService.login("demo", "pass"),
        sessionService.syncStateStream
          .pipe(
            failOnStates([SyncState.FAILED]),
            waitForChangeTo(SyncState.COMPLETED)
          )
          .toPromise(),
      ]);

      sessionService.logout();
      expect(sessionService.loginState).toEqual(LoginState.LOGGED_OUT);
      expect(sessionService.connectionState).toEqual(
        ConnectionState.DISCONNECTED
      );

      expect(sessionService.isLoggedIn()).toEqual(false);
      expect(sessionService.getCurrentUser()).not.toBeDefined();
    });
  });

  // These tests mock the login-methods of local and remote session.
  // We cannot test whether the StateHandlers are in correct state, as these are set in the sub-classes themselves.
  describe("Mocked Tests", () => {
    let localSession: LocalSession;
    let remoteSession: RemoteSession;
    let syncSpy: jasmine.Spy;
    let liveSyncSpy: jasmine.Spy;

    beforeEach(() => {
      AppConfig.settings = {
        site_name: "Aam Digital - DEV",
        session_type: SessionType.mock,
        database: {
          name: "integration_tests",
          remote_url: "https://demo.aam-digital.com/db/",
        },
        webdav: { remote_url: "" },
      };
      // setup synced session service
      sessionService = new SyncedSessionService(
        alertService,
        jasmine.createSpyObj(["error", "warn"]),
        entitySchemaService
      );
      // make private members localSession and remoteSession available in the tests
      localSession = sessionService["_localSession"];
      remoteSession = sessionService["_remoteSession"];
      liveSyncSpy = spyOn(sessionService, "liveSyncDeferred");
    });

    function resolveSync() {
      syncSpy = spyOn(sessionService, "sync").and.resolveTo();
    }

    function rejectSync() {
      syncSpy = spyOn(sessionService, "sync").and.rejectWith();
    }

    async function mockLogin(
      loginState: LoginState,
      connectionState: ConnectionState,
      localLoginCallTimes: number = 1
    ): Promise<LoginState> {
      return mockLoginWithSpies(
        spyOn(localSession, "login").and.resolveTo(loginState),
        spyOn(remoteSession, "login").and.resolveTo(connectionState),
        localLoginCallTimes
      );
    }

    async function mockLoginWithSpies(
      localLogin: jasmine.Spy,
      remoteLogin: jasmine.Spy,
      localLoginCallTimes: number = 1
    ): Promise<LoginState> {
      const result = await sessionService.login("u", "p");
      tick();
      // login methods should have been called, the local one possibly twice
      expect(localLogin).toHaveBeenCalledWith("u", "p");
      expect(localLogin).toHaveBeenCalledTimes(localLoginCallTimes);
      expect(remoteLogin).toHaveBeenCalledWith("u", "p");
      return result;
    }

    it("behaves correctly when both local and remote session succeed (normal login)", fakeAsync(() => {
      resolveSync();
      const result = mockLogin(LoginState.LOGGED_IN, ConnectionState.CONNECTED);
      tick();
      expect(syncSpy).toHaveBeenCalled();
      expect(liveSyncSpy).toHaveBeenCalled();
      return expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    }));

    it("behaves correctly when both local and remote session reject (normal login with wrong password)", fakeAsync(() => {
      resolveSync();
      const result = mockLogin(
        LoginState.LOGIN_FAILED,
        ConnectionState.REJECTED
      );
      tick();
      expect(syncSpy).not.toHaveBeenCalled();
      return expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    }));

    it("behaves correctly in the offline scenario", fakeAsync(() => {
      resolveSync();
      const result = mockLogin(LoginState.LOGGED_IN, ConnectionState.OFFLINE);
      tick();
      expect(syncSpy).not.toHaveBeenCalled();
      return expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    }));

    it("behaves correctly when the local session rejects, but the remote session succeeds (password change, new password)", fakeAsync(() => {
      resolveSync();
      const result = mockLoginWithSpies(
        spyOn(localSession, "login").and.returnValues(
          Promise.resolve(LoginState.LOGIN_FAILED),
          Promise.resolve(LoginState.LOGGED_IN)
        ),
        spyOn(remoteSession, "login").and.resolveTo(ConnectionState.CONNECTED),
        2
      );
      tick();
      // sync should have been triggered
      expect(syncSpy).toHaveBeenCalled();
      expect(liveSyncSpy).toHaveBeenCalled();
      // result should be correct: initially the local login failed, so sessionService.login must return loginFailed
      return expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    }));

    it("behaves correctly when the local session logs in, but the remote session rejects (password change, old password)", fakeAsync(() => {
      const localLogout = spyOn(localSession, "logout");
      resolveSync();
      const result = mockLogin(LoginState.LOGGED_IN, ConnectionState.REJECTED);
      tick();
      expect(syncSpy).not.toHaveBeenCalled();
      expect(localLogout).toHaveBeenCalled();
      return expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    }));

    it("behaves correctly when the sync fails and the local login succeeds", fakeAsync(() => {
      rejectSync();
      const result = mockLogin(LoginState.LOGGED_IN, ConnectionState.CONNECTED);
      tick();
      expect(syncSpy).toHaveBeenCalled();
      expect(liveSyncSpy).toHaveBeenCalled();
      return expectAsync(result).toBeResolvedTo(LoginState.LOGGED_IN);
    }));

    it("behaves correctly when the sync fails and the local login fails", fakeAsync(() => {
      rejectSync();
      const result = mockLogin(
        LoginState.LOGIN_FAILED,
        ConnectionState.CONNECTED,
        2
      );
      tick();
      expect(syncSpy).toHaveBeenCalled();
      expect(liveSyncSpy).not.toHaveBeenCalled();
      return expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
    }));
  });
});
