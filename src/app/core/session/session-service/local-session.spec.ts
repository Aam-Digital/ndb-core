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

import { AppSettings } from "../../app-settings";
import { LocalSession } from "./local-session";
import { SessionType } from "../session-type";
import { PouchDatabase } from "../../database/pouch-database";
import { environment } from "../../../../environments/environment";
import { AuthUser } from "../auth/auth-user";
import { TEST_USER } from "../../../utils/mock-local-session";
import { TestBed } from "@angular/core/testing";

describe("LocalSessionService", () => {
  const userDBName = `${TEST_USER}-${AppSettings.DB_NAME}`;
  const deprecatedDBName = AppSettings.DB_NAME;
  const testUser: AuthUser = {
    name: TEST_USER,
    roles: ["user_app"],
  };
  let service: LocalSession;
  let database: jasmine.SpyObj<PouchDatabase>;

  beforeEach(() => {
    environment.session_type = SessionType.mock;
    database = jasmine.createSpyObj([
      "initInMemoryDB",
      "initIndexedDB",
      "isEmpty",
    ]);
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalSession);
  });

  afterEach(async () => {
    window.localStorage.removeItem(LocalSession.DEPRECATED_DB_KEY);
    const tmpDB = new PouchDatabase(undefined);
    await tmpDB.initInMemoryDB(userDBName).destroy();
    await tmpDB.initInMemoryDB(deprecatedDBName).destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create a pouchdb with the username of the logged in user", async () => {
    await service.initializeDatabaseForCurrentUser(testUser);

    expect(database.initInMemoryDB).toHaveBeenCalledWith(
      TEST_USER + "-" + AppSettings.DB_NAME,
    );
  });

  it("should create the database according to the session type in the AppSettings", async () => {
    async function testDatabaseCreation(
      sessionType: SessionType,
      expectedDB: "inMemory" | "indexed",
    ) {
      database.initInMemoryDB.calls.reset();
      database.initIndexedDB.calls.reset();
      environment.session_type = sessionType;
      await service.initializeDatabaseForCurrentUser(testUser);
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

    await service.initializeDatabaseForCurrentUser(testUser);

    expect(database.initInMemoryDB).toHaveBeenCalledOnceWith(userDBName);
  });

  it("should use and reserve a deprecated db if it exists and current db has no content", async () => {
    await defineExistingDatabases(false, true);

    await service.initializeDatabaseForCurrentUser(testUser);

    expect(database.initInMemoryDB).toHaveBeenCalledOnceWith(deprecatedDBName);
    const dbReservation = window.localStorage.getItem(
      LocalSession.DEPRECATED_DB_KEY,
    );
    expect(dbReservation).toBe(TEST_USER);
  });

  it("should open a new database if deprecated db is already in use", async () => {
    await defineExistingDatabases(false, true, "other-user");

    await service.initializeDatabaseForCurrentUser(testUser);

    expect(database.initInMemoryDB).toHaveBeenCalledOnceWith(userDBName);
  });

  it("should use the deprecated database if it is reserved by the current user", async () => {
    await defineExistingDatabases(false, true, TEST_USER);

    await service.initializeDatabaseForCurrentUser(testUser);

    expect(database.initInMemoryDB).toHaveBeenCalledOnceWith(deprecatedDBName);
  });

  async function defineExistingDatabases(
    initUserDB: boolean,
    initDeprecatedDB: boolean,
    reserved?: string,
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
});
