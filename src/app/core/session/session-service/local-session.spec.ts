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

import { AppSettings } from "../../app-config/app-settings";
import { LocalSession } from "./local-session";
import { SessionType } from "../session-type";
import { LocalUser, passwordEqualsEncrypted } from "./local-user";
import { LoginState } from "../session-states/login-state.enum";
import { testSessionServiceImplementation } from "./session.service.spec";
import { TEST_PASSWORD, TEST_USER } from "../../../utils/mocked-testing.module";
import { PouchDatabase } from "../../database/pouch-database";
import { environment } from "../../../../environments/environment";
import { AuthUser } from "./auth-user";

describe("LocalSessionService", () => {
  let userDBName;
  let deprecatedDBName;
  let localSession: LocalSession;
  let testUser: AuthUser;
  let database: jasmine.SpyObj<PouchDatabase>;

  beforeEach(() => {
    environment.session_type = SessionType.mock;
    userDBName = `${TEST_USER}-${AppSettings.DB_NAME}`;
    deprecatedDBName = AppSettings.DB_NAME;
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

  afterEach(async () => {
    localSession.removeUser(TEST_USER);
    window.localStorage.removeItem(LocalSession.DEPRECATED_DB_KEY);
    const tmpDB = new PouchDatabase(undefined);
    await tmpDB.initInMemoryDB(userDBName).destroy();
    await tmpDB.initInMemoryDB(deprecatedDBName).destroy();
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

  it("should be case-insensitive and ignore spaces in username", async () => {
    expect(localSession.loginState.value).toBe(LoginState.LOGGED_OUT);
    const user: AuthUser = {
      name: "UserName",
      roles: [],
    };
    localSession.saveUser(user, TEST_PASSWORD);

    await localSession.login(" Username ", TEST_PASSWORD);

    expect(localSession.loginState.value).toBe(LoginState.LOGGED_IN);
    expect(localSession.getCurrentUser().name).toBe("UserName");

    localSession.removeUser("username");
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
      TEST_USER + "-" + AppSettings.DB_NAME
    );
    expect(localSession.getDatabase()).toBe(database);
  });

  it("should create the database according to the session type in the AppSettings", async () => {
    async function testDatabaseCreation(
      sessionType: SessionType,
      expectedDB: "inMemory" | "indexed"
    ) {
      database.initInMemoryDB.calls.reset();
      database.initIndexedDB.calls.reset();
      environment.session_type = sessionType;
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
    await defineExistingDatabases(true, false);

    await localSession.login(TEST_USER, TEST_PASSWORD);

    expect(database.initInMemoryDB).toHaveBeenCalledOnceWith(userDBName);
  });

  it("should use and reserve a deprecated db if it exists and current db has no content", async () => {
    await defineExistingDatabases(false, true);

    await localSession.login(TEST_USER, TEST_PASSWORD);

    expect(database.initInMemoryDB).toHaveBeenCalledOnceWith(deprecatedDBName);
    const dbReservation = window.localStorage.getItem(
      LocalSession.DEPRECATED_DB_KEY
    );
    expect(dbReservation).toBe(TEST_USER);
  });

  it("should open a new database if deprecated db is already in use", async () => {
    await defineExistingDatabases(false, true, "other-user");

    await localSession.login(TEST_USER, TEST_PASSWORD);

    expect(database.initInMemoryDB).toHaveBeenCalledOnceWith(userDBName);
  });

  it("should use the deprecated database if it is reserved by the current user", async () => {
    await defineExistingDatabases(false, true, TEST_USER);

    await localSession.login(TEST_USER, TEST_PASSWORD);

    expect(database.initInMemoryDB).toHaveBeenCalledOnceWith(deprecatedDBName);
  });

  async function defineExistingDatabases(
    initUserDB: boolean,
    initDeprecatedDB: boolean,
    reserved?: string
  ) {
    if (reserved) {
      window.localStorage.setItem(LocalSession.DEPRECATED_DB_KEY, reserved);
    }
    const tmpDB = new PouchDatabase(undefined);
    if (initUserDB) {
      await tmpDB.initInMemoryDB(userDBName).put({ _id: "someDoc" });
    }
    if (initDeprecatedDB) {
      await tmpDB.initInMemoryDB(deprecatedDBName).put({ _id: "someDoc" });
    }
  }

  testSessionServiceImplementation(() => Promise.resolve(localSession));
});
