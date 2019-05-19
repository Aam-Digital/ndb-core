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

import { EventEmitter, Injectable } from '@angular/core';
import { Database } from './database';
import { DatabaseSyncStatus } from './database-sync-status.enum';

/**
 * DatabaseManagerService takes care of 'background' actions of the
 * database (e.g. sync, authentication, etc.).
 *
 * To put/get actual data from the database inject `Database` instead,
 * which will be provided through DatabaseManagerService.
 */
@Injectable()
export abstract class DatabaseManagerService {

  _onSyncStatusChanged: EventEmitter<DatabaseSyncStatus> = null;
  get onSyncStatusChanged() {
    if (this._onSyncStatusChanged === null) {
      this._onSyncStatusChanged = new EventEmitter<DatabaseSyncStatus>(true);
    }
    return this._onSyncStatusChanged;
  }

  abstract login(username: string, password: string): Promise<boolean>;

  abstract logout(): void;

  abstract getDatabase(): Database;

  abstract signupUser(): void;

}

export function databaseServiceFactory(_databaseManagerService: DatabaseManagerService) {
  return _databaseManagerService.getDatabase();
}

export let databaseServiceProvider = {
  provide: Database,
  useFactory: databaseServiceFactory,
  deps: [DatabaseManagerService]
};
