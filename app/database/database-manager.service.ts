import { Injectable, provide } from "angular2/core";
import { Database } from "./database";

/**
 * DatabaseManagerService takes care of "background" actions of the database (e.g. sync, authentication, etc.).
 *
 * To put/get actual data from the database inject `Database` instead, which will be provided by DatabaseManagerService.
 */
@Injectable()
export class DatabaseManagerService {


    login(username: string, password: string) {

    }

    logout():void {

    }

    getDatabase(): Database {
        return null;
    }
}


let databaseServiceFactory = (_databaseManagerService: DatabaseManagerService) => {
    return _databaseManagerService.getDatabase();
};

export let databaseServiceProvider =
    provide(Database, {
        useFactory: databaseServiceFactory,
        deps: [DatabaseManagerService]
    });
