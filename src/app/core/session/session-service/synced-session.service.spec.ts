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
import { LocalSession } from "./local-session/local-session";
import { RemoteSession } from "./remote-session";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { SessionType } from "../session-type";
import { fakeAsync, tick } from "@angular/core/testing";
import { User } from "../../user/user";

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
        entitySchemaService,
        null
      );
    });

    it("has the correct Initial State", () => {
      expect(sessionService.getLoginState().getState()).toEqual(
        LoginState.LOGGED_OUT
      );
      expect(sessionService.getSyncState().getState()).toEqual(
        SyncState.UNSYNCED
      );
      expect(sessionService.getConnectionState().getState()).toEqual(
        ConnectionState.DISCONNECTED
      );

      expect(sessionService.isLoggedIn()).toEqual(false);
      expect(sessionService.getCurrentUser()).not.toBeDefined();
    });

    it("has the correct state after Login with wrong credentials", async () => {
      const loginState = await sessionService.login("demo", "pass123");
      expect(loginState).toEqual(LoginState.LOGIN_FAILED);
      expect(sessionService.getLoginState().getState()).toEqual(
        LoginState.LOGIN_FAILED
      );
      expect(sessionService.getSyncState().getState()).toEqual(
        SyncState.UNSYNCED
      );

      // remote session takes a bit longer than a local login - this throws on successful connection
      await sessionService
        .getConnectionState()
        .waitForChangeTo(ConnectionState.REJECTED, [ConnectionState.CONNECTED]);

      expect(sessionService.isLoggedIn()).toEqual(false);
      expect(sessionService.getCurrentUser()).not.toBeDefined();
    });

    it("has the correct state after Login with non-existing user", async () => {
      const loginState = await sessionService.login("demo123", "pass123");
      expect(loginState).toEqual(LoginState.LOGIN_FAILED);
      expect(sessionService.getLoginState().getState()).toEqual(
        LoginState.LOGIN_FAILED
      );
      expect(sessionService.getSyncState().getState()).toEqual(
        SyncState.UNSYNCED
      );

      // remote session takes a bit longer than a local login - this throws on successful connection
      await sessionService
        .getConnectionState()
        .waitForChangeTo(ConnectionState.REJECTED, [ConnectionState.CONNECTED]);

      expect(sessionService.isLoggedIn()).toEqual(false);
      expect(sessionService.getCurrentUser()).not.toBeDefined();
    });

    it("has the correct state after Login with correct credentials", async () => {
      const [loginState] = await Promise.all([
        sessionService.login("demo", "pass"),
        sessionService
          .getSyncState()
          .waitForChangeTo(SyncState.COMPLETED, [SyncState.FAILED]),
      ]);
      expect(loginState).toEqual(LoginState.LOGGED_IN);
      expect(sessionService.getLoginState().getState()).toEqual(
        LoginState.LOGGED_IN
      );
      expect(sessionService.getSyncState().getState()).toEqual(
        SyncState.COMPLETED
      );
      expect(sessionService.getConnectionState().getState()).toEqual(
        ConnectionState.CONNECTED
      );

      expect(sessionService.isLoggedIn()).toEqual(true);
      expect(sessionService.getCurrentUser()).toBeDefined();
    });

    it("has the correct state after Logout", async () => {
      await Promise.all([
        sessionService.login("demo", "pass"),
        sessionService
          .getSyncState()
          .waitForChangeTo(SyncState.COMPLETED, [SyncState.FAILED]),
      ]);

      sessionService.logout();
      expect(sessionService.getLoginState().getState()).toEqual(
        LoginState.LOGGED_OUT
      );
      expect(sessionService.getConnectionState().getState()).toEqual(
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
        entitySchemaService,
        null
      );
      // make private members localSession and remoteSession available in the tests
      localSession = sessionService["_localSession"];
      remoteSession = sessionService["_remoteSession"];
    });

    it("behaves correctly when both local and remote session succeed (normal login)", async () => {
      spyOn(localSession, "login").and.resolveTo(LoginState.LOGGED_IN);
      spyOn(remoteSession, "login").and.resolveTo(ConnectionState.CONNECTED);
      spyOn(sessionService, "sync").and.resolveTo();
      spyOn(sessionService, "liveSyncDeferred");
      spyOn(sessionService, "loadUser").and.resolveTo();

      const result = await sessionService.login("u", "p");

      expect(localSession.login).toHaveBeenCalledWith("u", "p");
      expect(remoteSession.login).toHaveBeenCalledWith("u", "p");
      expect(sessionService.sync).toHaveBeenCalledTimes(1);
      expect(sessionService.liveSyncDeferred).toHaveBeenCalledTimes(1);
      expect(result).toEqual(LoginState.LOGGED_IN);
    });

    it("behaves correctly when both local and remote session reject (normal login with wrong password)", (done) => {
      const localLogin = spyOn(localSession, "login").and.returnValue(
        Promise.resolve(LoginState.LOGIN_FAILED)
      );
      const remoteLogin = spyOn(remoteSession, "login").and.returnValue(
        Promise.resolve(ConnectionState.REJECTED)
      );
      const syncSpy = spyOn(sessionService, "sync").and.returnValue(
        Promise.resolve()
      );
      const result = sessionService.login("u", "p");
      setTimeout(async () => {
        // wait for the next event cycle loop --> all Promise handlers are evaluated before this
        // login methods should have been called, the local one twice
        expect(localLogin.calls.allArgs()).toEqual([["u", "p"]]);
        expect(remoteLogin.calls.allArgs()).toEqual([["u", "p"]]);
        // sync should have been triggered
        expect(syncSpy.calls.count()).toEqual(0);
        // result should be correct
        expect(await result).toEqual(LoginState.LOGIN_FAILED);
        done();
      });
    });

    it("behaves correctly in the offline scenario", async () => {
      spyOn(localSession, "login").and.resolveTo(LoginState.LOGGED_IN);
      spyOn(remoteSession, "login").and.resolveTo(ConnectionState.OFFLINE);
      spyOn(sessionService, "sync").and.resolveTo();
      spyOn(sessionService, "loadUser").and.resolveTo();

      const result = await sessionService.login("u", "p");

      expect(localSession.login).toHaveBeenCalledWith("u", "p");
      expect(remoteSession.login).toHaveBeenCalledWith("u", "p");
      expect(sessionService.sync).not.toHaveBeenCalled();
      expect(result).toEqual(LoginState.LOGGED_IN);
    });

    it("behaves correctly when the local session rejects, but the remote session succeeds (password change, new password)", (done) => {
      const localLogin = spyOn(localSession, "login").and.returnValues(
        Promise.resolve(LoginState.LOGIN_FAILED),
        Promise.resolve(LoginState.LOGGED_IN)
      );
      const remoteLogin = spyOn(remoteSession, "login").and.resolveTo(ConnectionState.CONNECTED);
      const syncSpy = spyOn(sessionService, "sync").and.resolveTo();
      const liveSyncSpy = spyOn(sessionService, "liveSyncDeferred");
      const result = sessionService.login("u", "p");
      setTimeout(async () => {
        // wait for the next event cycle loop --> all Promise handlers are evaluated before this
        // login methods should have been called, the local one twice
        expect(localLogin.calls.allArgs()).toEqual([
          ["u", "p"],
          ["u", "p"],
        ]);
        expect(remoteLogin.calls.allArgs()).toEqual([["u", "p"]]);
        // sync should have been triggered
        expect(syncSpy.calls.count()).toEqual(1);
        expect(liveSyncSpy.calls.count()).toEqual(1);
        // result should be correct: initially the local login failed, so sessionService.login must return loginFailed
        expect(await result).toEqual(LoginState.LOGIN_FAILED);
        done();
      });
    });

    it("behaves correctly when the local session logs in, but the remote session rejects (password change, old password", async () => {
      spyOn(localSession, "login").and.resolveTo(LoginState.LOGGED_IN);
      spyOn(localSession, "logout").and.rejectWith();
      spyOn(remoteSession, "login").and.resolveTo(ConnectionState.REJECTED);
      spyOn(sessionService, "sync").and.resolveTo();
      spyOn(sessionService, "loadUser").and.resolveTo();

      const result = await sessionService.login("u", "p");

      expect(localSession.login).toHaveBeenCalledWith("u", "p");
      expect(remoteSession.login).toHaveBeenCalledWith("u", "p");
      expect(sessionService.sync).not.toHaveBeenCalled();
      expect(localSession.logout).toHaveBeenCalled();
      expect(result).toEqual(LoginState.LOGGED_IN);
    });

    it("behaves correctly when the sync fails and the local login succeeds", fakeAsync(() => {
      spyOn(localSession, "login").and.resolveTo(LoginState.LOGGED_IN);
      spyOn(remoteSession, "login").and.resolveTo(ConnectionState.CONNECTED);
      spyOn(sessionService, "sync").and.rejectWith();
      spyOn(sessionService, "liveSyncDeferred");
      spyOn(sessionService, "loadUser").and.resolveTo();

      const login = sessionService.login("u", "p");
      tick();

      expect(localSession.login).toHaveBeenCalledWith("u", "p");
      expect(remoteSession.login).toHaveBeenCalledWith("u", "p");
      expect(sessionService.sync).toHaveBeenCalled();
      expect(sessionService.liveSyncDeferred).toHaveBeenCalled();
      expectAsync(login).toBeResolvedTo(LoginState.LOGGED_IN);
      tick();
    }));

    it("behaves correctly when the sync fails and the local login fails", fakeAsync(() => {
      spyOn(localSession, "login").and.resolveTo(LoginState.LOGIN_FAILED);
      spyOn(remoteSession, "login").and.resolveTo(ConnectionState.CONNECTED);
      spyOn(sessionService, "sync").and.rejectWith();
      spyOn(sessionService, "liveSyncDeferred");

      const result = sessionService.login("u", "p");
      tick();

      expect(localSession.login).toHaveBeenCalledWith("u", "p");
      expect(localSession.login).toHaveBeenCalledTimes(2);
      expect(remoteSession.login).toHaveBeenCalledWith("u", "p");
      expect(remoteSession.login).toHaveBeenCalledTimes(1);
      expect(sessionService.sync).toHaveBeenCalled();
      expect(sessionService.liveSyncDeferred).not.toHaveBeenCalled();
      expectAsync(result).toBeResolvedTo(LoginState.LOGIN_FAILED);
      tick();
    }));

    it("should load the user entity after successful local login", async () => {
      const testUser = new User("username");
      testUser.name = "username";
      const database = sessionService.getDatabase();
      spyOn(database, "get").and.resolveTo(
        entitySchemaService.transformEntityToDatabaseFormat(testUser)
      );
      spyOn(localSession, "login").and.resolveTo(LoginState.LOGGED_IN);

      await sessionService.login("username", "password");

      expect(localSession.login).toHaveBeenCalledWith("username", "password");
      expect(database.get).toHaveBeenCalledWith(testUser._id);
      expect(sessionService.getCurrentUser()).toEqual(testUser);
    });
  });
});
