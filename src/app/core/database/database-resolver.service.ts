import { inject, Injectable } from "@angular/core";
import { Database } from "./database";
import { SessionInfo } from "../session/auth/session-info";
import { environment } from "../../../environments/environment";
import { DatabaseFactoryService } from "./database-factory.service";

/**
 * Manages access to individual databases,
 * as data may be stored across multiple different instances.
 */
@Injectable({
  providedIn: "root",
})
export class DatabaseResolverService {
  static readonly DEFAULT_DB = "app";

  private databases: Map<string, Database> = new Map();
  private databaseFactory = inject(DatabaseFactoryService);

  getDatabase(dbName: string = DatabaseResolverService.DEFAULT_DB): Database {
    return this.databases.get(dbName);
  }

  resetDatabases() {}

  async initDatabasesForSession(session: SessionInfo) {
    this.initializeAppDatabaseForCurrentUser(session);
    // TODO: init other DBs
  }

  private initializeAppDatabaseForCurrentUser(user: SessionInfo) {
    const userDBName = `${user.name}-${environment.DB_NAME}`;
    const userDb = this.databaseFactory.createDatabase(userDBName);
    this.databases.set(environment.DB_NAME, userDb);

    // TODO: have removed fallback to old "app" IndexedDB database here; check sentry if this may cause larger impact
  }
}
