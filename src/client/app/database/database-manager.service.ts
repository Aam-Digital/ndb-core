import { EventEmitter } from '@angular/core';
import { Database } from './database';
import { DatabaseSyncStatus } from './database-sync-status';

/**
 * DatabaseManagerService takes care of "background" actions of the database (e.g. sync, authentication, etc.).
 *
 * To put/get actual data from the database inject `Database` instead, which will be provided through DatabaseManagerService.
 */
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
}


let databaseServiceFactory = (_databaseManagerService: DatabaseManagerService) => {
    return _databaseManagerService.getDatabase();
};

export let databaseServiceProvider = {
    provide: Database,
    useFactory: databaseServiceFactory,
    deps: [DatabaseManagerService]
};
