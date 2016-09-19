import {Injectable} from '@angular/core';

import {Database} from './database';
import {PouchDatabase} from './pouch-database';
import {DatabaseManagerService} from './database-manager.service';
import {DatabaseSyncStatus} from './database-sync-status';
import {ConfigService} from '../config/config.service';

/**
 * DatabaseManagerService takes care of 'background' actions of the database (e.g. sync, authentication, etc.).
 *
 * To put/get actual data from the database inject `Database` instead, which will be provided through DatabaseManagerService.
 */
@Injectable()
export class PouchDatabaseManagerService extends DatabaseManagerService {
    private _localDatabase: any;
    private _remoteDatabase: any;

    constructor(private _appConfig: ConfigService) {
        super();

        this._localDatabase = new PouchDB(this._appConfig.database.name);
        this._remoteDatabase = new PouchDB(this._appConfig.database.remote_url + this._appConfig.database.name,
            { ajax: { rejectUnauthorized: false, timeout: this._appConfig.database.timeout } });
    }


    getDatabase(): Database {
        return new PouchDatabase(this._localDatabase);
    }

    login(username: string, password: string): Promise<boolean> {
        var ajaxOpts = {
            ajax: {
                headers: {
                    Authorization: 'Basic ' + window.btoa(username + ':' + password)
                }
            }
        };

        let self = this;
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

        let self = this;
        //do NOT use liveSync because then the promise is never resolved
        //TODO: retrigger sync continuously
        return this._localDatabase.sync(this._remoteDatabase).then(
            function () {
                self.onSyncStatusChanged.emit(DatabaseSyncStatus.completed);
            },
            function (err: any) {
                console.debug('sync failed:');
                console.debug(err);
                self.onSyncStatusChanged.emit(DatabaseSyncStatus.failed);
            });
    }
}
