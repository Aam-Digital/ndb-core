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
import { Injectable } from "@angular/core";
import { PouchDatabase } from "../../database/pouch-database";
import { AppSettings } from "../../app-settings";
import { SessionType } from "../session-type";
import { environment } from "../../../../environments/environment";
import { AuthUser } from "../auth/auth-user";
import { Database } from "../../database/database";

/**
 * Responsibilities:
 * - Manage local authentication
 * - Save users in local storage
 * - Create local PouchDB according to session type and logged in user
 */
@Injectable()
export class LocalSession {
  static readonly DEPRECATED_DB_KEY = "RESERVED_FOR";
  private pouchDatabase: PouchDatabase;

  constructor(database: Database) {
    if (database instanceof PouchDatabase) {
      this.pouchDatabase = database;
    }
  }

  async initializeDatabaseForCurrentUser(user: AuthUser) {
    const userDBName = `${user.name}-${AppSettings.DB_NAME}`;
    // Work on a temporary database before initializing the real one
    const tmpDB = new PouchDatabase(undefined);
    this.initDatabase(userDBName, tmpDB);
    if (!(await tmpDB.isEmpty())) {
      // Current user has own database, we are done here
      this.initDatabase(userDBName);
      return;
    }

    this.initDatabase(AppSettings.DB_NAME, tmpDB);
    const dbFallback = window.localStorage.getItem(
      LocalSession.DEPRECATED_DB_KEY,
    );
    const dbAvailable = !dbFallback || dbFallback === user.name;
    if (dbAvailable && !(await tmpDB.isEmpty())) {
      // Old database is available and can be used by the current user
      window.localStorage.setItem(LocalSession.DEPRECATED_DB_KEY, user.name);
      this.initDatabase(AppSettings.DB_NAME);
      return;
    }

    // Create a new database for the current user
    this.initDatabase(userDBName);
  }

  private initDatabase(dbName: string, db = this.pouchDatabase) {
    if (environment.session_type === SessionType.mock) {
      db.initInMemoryDB(dbName);
    } else {
      db.initIndexedDB(dbName);
    }
  }
}
