import { provide } from "angular2/core";
import { Database } from "./database";

/**
 * DatabaseManagerService takes care of "background" actions of the database (e.g. sync, authentication, etc.).
 *
 * To put/get actual data from the database inject `Database` instead, which will be provided through DatabaseManagerService.
 */
export abstract class DatabaseManagerService {

    abstract login(username: string, password: string);
    abstract logout();

    abstract getDatabase(): Database;
}


let databaseServiceFactory = (_databaseManagerService: DatabaseManagerService) => {
    return _databaseManagerService.getDatabase();
};

export let databaseServiceProvider =
    provide(Database, {
        useFactory: databaseServiceFactory,
        deps: [DatabaseManagerService]
    });
