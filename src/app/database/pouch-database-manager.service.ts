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

import {Injectable} from '@angular/core';
import PouchDB from 'pouchdb';
import PouchDBAuthentication from 'pouchdb-authentication';
import {AppConfig} from '../app-config/app-config';
import {DatabaseManagerService} from './database-manager.service';
import {DatabaseSyncStatus} from './database-sync-status.enum';
import {Database} from './database';
import {PouchDatabase} from './pouch-database';
import {AlertService} from '../alerts/alert.service';

PouchDB.plugin(PouchDBAuthentication);

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
  private liveSyncHandler;

  constructor(private alertService: AlertService) {
    super();

    this._localDatabase = new PouchDB(AppConfig.settings.database.name);
    this._remoteDatabase = new PouchDB(AppConfig.settings.database.remote_url + AppConfig.settings.database.name,
      {
        ajax: {
          rejectUnauthorized: false, timeout: AppConfig.settings.database.timeout,
        },
        // This is a workaround for PouchDB 7.0.0 with pouchdb-authentication 1.1.3:
        // https://github.com/pouchdb-community/pouchdb-authentication/issues/239
        // It is necessary, until this merged PR will be published in PouchDB 7.0.1
        // https://github.com/pouchdb/pouchdb/pull/7395
        fetch(url, opts) {
          opts.credentials = 'include';
          return (PouchDB as any).fetch(url, opts);
        },
        skip_setup: true
      } as PouchDB.Configuration.RemoteDatabaseConfiguration
    );
  }

  getDatabase(): Database {
    return new PouchDatabase(this._localDatabase, this.alertService);
  }

  login(username: string, password: string): Promise<boolean> {
    const ajaxOpts = {
      ajax: {
        headers: {
          Authorization: 'Basic ' + window.btoa(username + ':' + password)
        }
      }
    };

    return this._remoteDatabase.login(username, password, ajaxOpts).then(
      () => {
        this.sync();
        return true;
      },
      (error: any) => {
        if (error.status === 401) {
          return false;
        } else {
          this.alertService.addWarning('Failed to connect to the remote database: ' + error);
          throw error;
        }
      }
    );
  }

  logout(): void {
    this._remoteDatabase.logout();
  }

  private sync() {
    this.onSyncStatusChanged.emit(DatabaseSyncStatus.started);

    // do NOT use liveSync because then the promise is never resolved
    // we need to trigger the live sync after the sync has completed once
    return this._localDatabase.sync(this._remoteDatabase).then(
      () => {
        this.onSyncStatusChanged.emit(DatabaseSyncStatus.completed);

        // start live replication in the background
        setTimeout(() => this.syncLive(), 1000);
      },
      (err: any) => {
        this.alertService.addDebug('Database synchronization failed: ' + err);
        this.onSyncStatusChanged.emit(DatabaseSyncStatus.failed);
        setTimeout(() => this.sync(), 60000);
      });
  }

  private syncLive() {
    this.liveSyncHandler = this._localDatabase.sync(this._remoteDatabase, {
      live: true,
      retry: true
    }).on('change', (change) => {
      if (change.direction === 'push') {
        this.onSyncStatusChanged.emit(DatabaseSyncStatus.pushedChanges);
      } else if (change.direction === 'pull') {
        this.onSyncStatusChanged.emit(DatabaseSyncStatus.pulledChanges);
      }
    }).on('error', (err) => {
      this.alertService.addWarning('Error during database synchronization.');
      this.alertService.addDebug(err);
    });
    // on('paused') and on('active') doesn't work as expected and is triggered after/before every update

    this.alertService.addInfo('Database live synchronization started.');
  }
}
