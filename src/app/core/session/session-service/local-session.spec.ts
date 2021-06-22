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

import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { AppConfig } from "../../app-config/app-config";
import { LocalSession } from "./local-session";
import { SessionType } from "../session-type";
import { fakeAsync, tick } from "@angular/core/testing";
import { User } from "../../user/user";
import { PouchDatabase } from "../../database/pouch-database";
import { LoginState } from "../session-states/login-state.enum";
import { SyncState } from "../session-states/sync-state.enum";

describe("LocalSessionService", () => {
  let localSession: LocalSession;

  beforeEach(async () => {
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.synced,
      database: {
        name: "integration_tests",
        remote_url: "https://some.url.de/db/",
      },
    };
    const schemaService = new EntitySchemaService();
    localSession = new LocalSession(schemaService);
    // @ts-ignore
    localSession.database = PouchDatabase.createWithInMemoryDB()._pouchDB;

    const user = new User("test");
    user.setNewPassword("pass");
    const dbUser = schemaService.transformEntityToDatabaseFormat(user);
    await localSession.database.put(dbUser);
  });

  afterEach(async () => {
    await localSession.database.destroy();
  });

  it("should be created", () => {
    expect(localSession).toBeDefined();
  });

  it("should login a user after the initial sync if not database is present", fakeAsync(() => {
    spyOn(localSession.database, "info").and.resolveTo({ doc_count: 0 });
    localSession.login("test", "pass");
    tick();
    expect(localSession.loginState).toBe(LoginState.LOGGED_OUT);

    localSession.syncStateStream.next(SyncState.STARTED);
    tick();
    expect(localSession.loginState).toBe(LoginState.LOGGED_OUT);

    localSession.syncStateStream.next(SyncState.COMPLETED);
    tick();
    expect(localSession.loginState).toBe(LoginState.LOGGED_IN);
  }));

  it("should not wait for sync completion if local database already exists", fakeAsync(() => {
    spyOn(localSession.database, "info").and.resolveTo({ doc_count: 1 });
    expect(localSession.loginState).toBe(LoginState.LOGGED_OUT);
    expect(localSession.syncState).toBe(SyncState.UNSYNCED);

    localSession.login("test", "pass");
    tick();

    expect(localSession.loginState).toBe(LoginState.LOGGED_IN);
    expect(localSession.syncState).not.toBe(SyncState.COMPLETED);
  }));
});
