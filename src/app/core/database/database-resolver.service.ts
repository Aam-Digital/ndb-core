import { Injectable } from "@angular/core";
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

  constructor(private databaseFactory: DatabaseFactoryService) {
    this.initDatabaseStubs();
  }

  /**
   * Generate Database objects so that change subscriptions and other operations
   * can already be performed during bootstrap.
   * @private
   */
  private initDatabaseStubs() {
    this.databases.set(
      DatabaseResolverService.DEFAULT_DB,
      this.databaseFactory.createDatabase(),
    );
  }

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
    this.databaseFactory.initDatabase(
      this.getDatabase(DatabaseResolverService.DEFAULT_DB),
      userDBName,
    );

    // TODO: have removed fallback to old "app" IndexedDB database here; check sentry if this may cause larger impact
  }
}
