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

import { AppConfig } from "../../app-config/app-config";
import { LocalSession } from "./local-session";
import { SessionType } from "../session-type";
import { DatabaseUser, LocalUser, passwordEqualsEncrypted } from "./local-user";
import { LoginState } from "../session-states/login-state.enum";
import { testSessionServiceImplementation } from "./session.service.spec";
import { TEST_PASSWORD, TEST_USER } from "../mock-session.module";
import { PouchDatabase } from "../../database/pouch-database";

describe("LocalSessionService", () => {
  let localSession: LocalSession;
  let testUser: DatabaseUser;
  let database: jasmine.SpyObj<PouchDatabase>;

  beforeEach(() => {
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.mock,
      database: {
        name: "test-db-name",
        remote_url: "https://demo.aam-digital.com/db/",
      },
    };
    database = jasmine.createSpyObj([
      "initInMemoryDB",
      "initIndexedDB",
      "isEmpty",
    ]);
    localSession = new LocalSession(database);
  });

  beforeEach(() => {
    testUser = {
      name: TEST_USER,
      roles: ["user_app"],
    };
    localSession.saveUser(testUser, TEST_PASSWORD);
  });

  afterEach(() => {
    localSession.removeUser(TEST_USER);
    window.localStorage.removeItem(LocalSession.DEPRECATED_DB_KEY);
  });

  it("should be created", () => {
    expect(localSession).toBeDefined();
  });

  it("should save user objects to local storage", () => {
    const storedUser: LocalUser = JSON.parse(
      window.localStorage.getItem(testUser.name)
    );
    expect(storedUser.name).toBe(testUser.name);
    expect(storedUser.roles).toEqual(testUser.roles);
    expect(
      passwordEqualsEncrypted(TEST_PASSWORD, storedUser.encryptedPassword)
    ).toBeTrue();
  });

  it("should login a previously saved user with correct password", async () => {
    expect(localSession.loginState.value).toBe(LoginState.LOGGED_OUT);

    await localSession.login(TEST_USER, TEST_PASSWORD);

    expect(localSession.loginState.value).toBe(LoginState.LOGGED_IN);
  });

  it("should fail login with correct username but wrong password", async () => {
    await localSession.login(TEST_USER, "wrong password");

    expect(localSession.loginState.value).toBe(LoginState.LOGIN_FAILED);
  });

  it("should fail login with wrong username", async () => {
    await localSession.login("wrongUsername", TEST_PASSWORD);

    expect(localSession.loginState.value).toBe(LoginState.UNAVAILABLE);
  });

  it("should assign current user after successful login", async () => {
    await localSession.login(TEST_USER, TEST_PASSWORD);

    const currentUser = localSession.getCurrentUser();

    expect(currentUser.name).toBe(TEST_USER);
    expect(currentUser.roles).toEqual(testUser.roles);
  });

  it("should fail login after a user is removed", async () => {
    localSession.removeUser(TEST_USER);

    await localSession.login(TEST_USER, TEST_PASSWORD);

    expect(localSession.loginState.value).toBe(LoginState.UNAVAILABLE);
    expect(localSession.getCurrentUser()).toBeUndefined();
  });

  it("should create a pouchdb with the username of the logged in user", async () => {
    await localSession.login(TEST_USER, TEST_PASSWORD);

    expect(database.initInMemoryDB).toHaveBeenCalledWith(
      TEST_USER + "-" + AppConfig.settings.database.name
    );
    expect(localSession.getDatabase()).toBe(database);
  });

  it("should create the database according to the session type in the AppConfig", async () => {
    async function testDatabaseCreation(
      sessionType: SessionType,
      expectedDB: "inMemory" | "indexed"
    ) {
      database.initInMemoryDB.calls.reset();
      database.initIndexedDB.calls.reset();
      AppConfig.settings.session_type = sessionType;
      await localSession.login(TEST_USER, TEST_PASSWORD);
      if (expectedDB === "inMemory") {
        expect(database.initInMemoryDB).toHaveBeenCalled();
        expect(database.initIndexedDB).not.toHaveBeenCalled();
      } else {
        expect(database.initInMemoryDB).not.toHaveBeenCalled();
        expect(database.initIndexedDB).toHaveBeenCalled();
      }
    }

    await testDatabaseCreation(SessionType.mock, "inMemory");
    await testDatabaseCreation(SessionType.local, "indexed");
    await testDatabaseCreation(SessionType.synced, "indexed");
  });

  it("should use current user db if database has content", async () => {
    defineExistingDatabases(true, false);

    await localSession.login(TEST_USER, TEST_PASSWORD);

    const dbName = database.initInMemoryDB.calls.mostRecent().args[0];
    expect(dbName).toBe(`${TEST_USER}-${AppConfig.settings.database.name}`);
  });

  it("should use and reserve a deprecated db if it exists and current db has no content", async () => {
    defineExistingDatabases(false, true);

    await localSession.login(TEST_USER, TEST_PASSWORD);

    const dbName = database.initInMemoryDB.calls.mostRecent().args[0];
    expect(dbName).toBe(AppConfig.settings.database.name);
    const dbReservation = window.localStorage.getItem(
      LocalSession.DEPRECATED_DB_KEY
    );
    expect(dbReservation).toBe(TEST_USER);
  });

  it("should open a new database if deprecated db is already in use", async () => {
    defineExistingDatabases(false, true, "other-user");

    await localSession.login(TEST_USER, TEST_PASSWORD);

    const dbName = database.initInMemoryDB.calls.mostRecent().args[0];
    expect(dbName).toBe(`${TEST_USER}-${AppConfig.settings.database.name}`);
  });

  it("should use the deprecated database if it is reserved by the current user", async () => {
    defineExistingDatabases(false, true, TEST_USER);

    await localSession.login(TEST_USER, TEST_PASSWORD);

    const dbName = database.initInMemoryDB.calls.mostRecent().args[0];
    expect(dbName).toBe(AppConfig.settings.database.name);
  });

  function defineExistingDatabases(userDB, deprecatedDB, reserved?: string) {
    if (reserved) {
      window.localStorage.setItem(LocalSession.DEPRECATED_DB_KEY, reserved);
    }
    database.isEmpty.and.callFake(() => {
      const dbName = database.initInMemoryDB.calls.mostRecent().args[0];
      if (dbName === AppConfig.settings.database.name) {
        return Promise.resolve(!deprecatedDB);
      }
      if (dbName === `${TEST_USER}-${AppConfig.settings.database.name}`) {
        return Promise.resolve(!userDB);
      } else {
        return Promise.reject("unexpected database name");
      }
    });
  }

  testSessionServiceImplementation(() => Promise.resolve(localSession));
});
