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

import { Injectable } from '@angular/core';
import * as PouchDB from 'pouchdb';
import { ConfigService } from '../config/config.service';
import { DatabaseManagerService } from './database-manager.service';
import { DatabaseSyncStatus } from './database-sync-status.enum';
import { Database } from './database';
import { PouchDatabase } from './pouch-database';

declare var require: any;
PouchDB.plugin(require('pouchdb-authentication'));
PouchDB.plugin(require('relational-pouch'));

/**
 * DatabaseManagerService takes care of 'background' actions
 * of the database (e.g. sync, authentication, etc.).
 *
 * To put/get actual data from the database inject `Database`
 * instead, which will be provided through DatabaseManagerService.
 */
@Injectable()
export class PouchDatabaseManagerService extends DatabaseManagerService {

  private _localDatabase: any;
  private _remoteDatabase: any;

  constructor(private _appConfig: ConfigService) {
    super();

    this._localDatabase = new PouchDB(this._appConfig.database.name);
    this._remoteDatabase = new PouchDB(this._appConfig.database.remote_url + this._appConfig.database.name,
      {ajax: {rejectUnauthorized: false, timeout: this._appConfig.database.timeout}});
  }

  getDatabase(): Database {
    return new PouchDatabase(this._localDatabase);
  }

  login(username: string, password: string): Promise<boolean> {
    const ajaxOpts = {
      ajax: {
        headers: {
          Authorization: 'Basic ' + window.btoa(username + ':' + password)
        }
      }
    };

    const self = this;
    return this._remoteDatabase.login(username, password, ajaxOpts).then(
      function () {
        self.sync();
        return true;
      },
      function (error: any) {
        if (error.status === 401) {
          return false;
        } else {
          console.error('Failed to connect to the remote database.', error);
          throw error;
        }
      });
  }

  logout(): void {
    this._remoteDatabase.logout();
  }

  private sync() {
    this.onSyncStatusChanged.emit(DatabaseSyncStatus.started);

    const self = this;
    // do NOT use liveSync because then the promise is never resolved
    // we need to trigger the live sync after the sync has completed once
    return this._localDatabase.sync(this._remoteDatabase).then(
      function () {
        self.onSyncStatusChanged.emit(DatabaseSyncStatus.completed);
      },
      function (err: any) {
        console.error('sync failed:');
        console.error(err);
        self.onSyncStatusChanged.emit(DatabaseSyncStatus.failed);
      });
  }
}
