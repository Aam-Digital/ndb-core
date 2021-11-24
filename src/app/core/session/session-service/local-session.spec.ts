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
  let database: PouchDatabase;

  beforeEach(() => {
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.mock,
      database: {
        name: "test-db-name",
        remote_url: "https://demo.aam-digital.com/db/",
      },
    };
    database = new PouchDatabase();
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
    spyOn(database, "initInMemoryDB");

    await localSession.login(TEST_USER, TEST_PASSWORD);

    expect(database.initInMemoryDB).toHaveBeenCalledWith(
      TEST_USER + "-" + AppConfig.settings.database.name
    );
    expect(localSession.getDatabase()).toBe(database);
  });

  it("should create the database according to the session type in the AppConfig", async () => {
    const inMemorySpy = spyOn(database, "initInMemoryDB");
    const indexedDBSpy = spyOn(database, "initIndexedDB");

    AppConfig.settings.session_type = SessionType.mock;
    await localSession.login(TEST_USER, TEST_PASSWORD);
    expect(inMemorySpy).toHaveBeenCalled();
    expect(indexedDBSpy).not.toHaveBeenCalled();

    inMemorySpy.calls.reset();
    indexedDBSpy.calls.reset();
    AppConfig.settings.session_type = SessionType.local;
    await localSession.login(TEST_USER, TEST_PASSWORD);
    expect(inMemorySpy).not.toHaveBeenCalled();
    expect(indexedDBSpy).toHaveBeenCalled();

    inMemorySpy.calls.reset();
    indexedDBSpy.calls.reset();
    AppConfig.settings.session_type = SessionType.synced;
    await localSession.login(TEST_USER, TEST_PASSWORD);
    expect(inMemorySpy).not.toHaveBeenCalled();
    expect(indexedDBSpy).toHaveBeenCalled();
  });

  testSessionServiceImplementation(() => Promise.resolve(localSession));
});
