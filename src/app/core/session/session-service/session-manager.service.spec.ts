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

import { SessionManagerService } from "./session-manager.service";
import { LoginState } from "../session-states/login-state.enum";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "../session-type";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { PouchDatabase } from "../../database/pouch-database";
import { environment } from "../../../../environments/environment";
import { AuthUser } from "../auth/auth-user";
import { TEST_USER } from "../../../utils/mock-local-session";
import { LocalAuthService } from "../auth/local/local-auth.service";
import { SyncService } from "../../database/sync.service";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { Database } from "../../database/database";
import { Router } from "@angular/router";
import { UserSubject } from "../../user/user";
import { AppSettings } from "../../app-settings";

describe("SessionManagerService", () => {
  let service: SessionManagerService;
  let loginStateSubject: LoginStateSubject;
  let userSubject: UserSubject;
  let mockKeycloak: jasmine.SpyObj<KeycloakAuthService>;
  let dbUser: AuthUser;
  const userDBName = `${TEST_USER}-${AppSettings.DB_NAME}`;
  const deprecatedDBName = AppSettings.DB_NAME;
  let initInMemorySpy: jasmine.Spy;
  let initIndexedSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    dbUser = { name: TEST_USER, roles: ["user_app"] };
    mockKeycloak = jasmine.createSpyObj([
      "autoLogin",
      "logout",
      "addAuthHeader",
    ]);
    mockKeycloak.login.and.rejectWith();
    mockKeycloak.login.and.resolveTo(dbUser);

    TestBed.configureTestingModule({
      providers: [
        SessionManagerService,
        SyncStateSubject,
        LoginStateSubject,
        UserSubject,
        { provide: Database, useClass: PouchDatabase },
        { provide: KeycloakAuthService, useValue: mockKeycloak },
      ],
    });
    service = TestBed.inject(SessionManagerService);
    loginStateSubject = TestBed.inject(LoginStateSubject);
    userSubject = TestBed.inject(UserSubject);

    const db = TestBed.inject(Database) as PouchDatabase;
    initInMemorySpy = spyOn(db, "initInMemoryDB").and.callThrough();
    initIndexedSpy = spyOn(db, "initIndexedDB").and.callThrough();
    TestBed.inject(LocalAuthService).saveUser(dbUser);
    environment.session_type = SessionType.mock;
  }));

  afterEach(async () => {
    localStorage.clear();
    window.localStorage.removeItem(service.DEPRECATED_DB_KEY);
    const tmpDB = new PouchDatabase(undefined);
    await tmpDB.initInMemoryDB(userDBName).destroy();
    await tmpDB.initInMemoryDB(deprecatedDBName).destroy();
  });

  it("should update the local user object once authenticated", async () => {
    const updatedUser: AuthUser = {
      name: TEST_USER,
      roles: dbUser.roles.concat("admin"),
    };
    mockKeycloak.login.and.resolveTo(updatedUser);
    const saveUserSpy = spyOn(TestBed.inject(LocalAuthService), "saveUser");
    const syncSpy = spyOn(TestBed.inject(SyncService), "startSync");

    await service.remoteLogin();

    expect(saveUserSpy).toHaveBeenCalledWith(updatedUser);
    expect(userSubject.value).toEqual(updatedUser);
    expect(syncSpy).toHaveBeenCalled();
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
  });

  it("should automatically login, if the session is still valid", async () => {
    await service.remoteLogin();

    expect(loginStateSubject.value).toEqual(LoginState.LOGGED_IN);
    expect(userSubject.value).toEqual(dbUser);
  });

  it("should trigger remote logout if remote login succeeded before", async () => {
    await service.remoteLogin();

    service.logout();

    expect(mockKeycloak.logout).toHaveBeenCalled();
  });

  it("should only reset local state if remote login did not happen", async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), "navigate");
    await service.offlineLogin(dbUser);
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
    expect(userSubject.value).toEqual(dbUser);

    service.logout();

    expect(mockKeycloak.logout).not.toHaveBeenCalled();
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_OUT);
    expect(userSubject.value).toBeUndefined();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it("should store information if remote session needs to be reset", () => {
    navigator.onLine = false;
  });

  it("should create a pouchdb with the username of the logged in user", async () => {
    await service.remoteLogin();

    expect(initInMemorySpy).toHaveBeenCalledWith(
      TEST_USER + "-" + AppSettings.DB_NAME,
    );
  });

  it("should create the database according to the session type in the AppSettings", async () => {
    async function testDatabaseCreation(
      sessionType: SessionType,
      expectedDB: "inMemory" | "indexed",
    ) {
      initInMemorySpy.calls.reset();
      initIndexedSpy.calls.reset();
      environment.session_type = sessionType;
      await service.remoteLogin();
      if (expectedDB === "inMemory") {
        expect(initInMemorySpy).toHaveBeenCalled();
        expect(initIndexedSpy).not.toHaveBeenCalled();
      } else {
        expect(initInMemorySpy).not.toHaveBeenCalled();
        expect(initIndexedSpy).toHaveBeenCalled();
      }
    }

    await testDatabaseCreation(SessionType.mock, "inMemory");
    await testDatabaseCreation(SessionType.local, "indexed");
    await testDatabaseCreation(SessionType.synced, "indexed");
  });

  it("should use current user db if database has content", async () => {
    await defineExistingDatabases(true, false);

    await service.remoteLogin();

    expect(initInMemorySpy).toHaveBeenCalledOnceWith(userDBName);
  });

  it("should use and reserve a deprecated db if it exists and current db has no content", async () => {
    await defineExistingDatabases(false, true);

    await service.remoteLogin();

    expect(initInMemorySpy).toHaveBeenCalledOnceWith(deprecatedDBName);
    const dbReservation = window.localStorage.getItem(
      service.DEPRECATED_DB_KEY,
    );
    expect(dbReservation).toBe(TEST_USER);
  });

  it("should open a new database if deprecated db is already in use", async () => {
    await defineExistingDatabases(false, true, "other-user");

    await service.remoteLogin();

    expect(initInMemorySpy).toHaveBeenCalledOnceWith(userDBName);
  });

  it("should use the deprecated database if it is reserved by the current user", async () => {
    await defineExistingDatabases(false, true, TEST_USER);

    await service.remoteLogin();

    expect(initInMemorySpy).toHaveBeenCalledOnceWith(deprecatedDBName);
  });

  async function defineExistingDatabases(
    initUserDB: boolean,
    initDeprecatedDB: boolean,
    reserved?: string,
  ) {
    if (reserved) {
      window.localStorage.setItem(service.DEPRECATED_DB_KEY, reserved);
    }
    const tmpDB = new PouchDatabase(undefined);
    if (initUserDB) {
      await tmpDB.initInMemoryDB(userDBName).put({ _id: "someDoc" });
    }
    if (initDeprecatedDB) {
      await tmpDB.initInMemoryDB(deprecatedDBName).put({ _id: "someDoc" });
    }
  }
});
