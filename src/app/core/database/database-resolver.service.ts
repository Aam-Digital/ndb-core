import { Injectable } from "@angular/core";
import { Database } from "./database";
import { SessionInfo } from "../session/auth/session-info";
import { environment } from "../../../environments/environment";
import { DatabaseFactoryService } from "./database-factory.service";
import { Entity } from "../entity/model/entity";

/**
 * Manages access to individual databases,
 * as data may be stored across multiple different instances.
 */
@Injectable({
  providedIn: "root",
})
export class DatabaseResolverService {
  private databases: Map<string, Database> = new Map();
  private fallbackToRemote = false;

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
      Entity.DATABASE,
      this.databaseFactory.createDatabase(Entity.DATABASE),
    );
  }

  getDatabase(dbName: string = Entity.DATABASE): Database {
    let db = this.databases.get(dbName);
    if (!db.isInitialized() && this.fallbackToRemote) {
      db = this.databaseFactory.createRemoteDatabase(dbName);
    }
    return db;
  }

  async resetDatabases() {
    for (const db of this.databases.values()) {
      await db.reset();
    }
  }

  async destroyDatabases() {
    for (const db of this.databases.values()) {
      await db.destroy();
    }
  }

  async initDatabasesForSession(session: SessionInfo) {
    this.initializeAppDatabaseForCurrentUser(session);
    // ... in future initialize additional DBs here
  }

  private initializeAppDatabaseForCurrentUser(user: SessionInfo) {
    const userDBName = `${user.name}-${environment.DB_NAME}`;
    this.getDatabase(Entity.DATABASE).init(userDBName);

    // TODO: have removed fallback to old "app" IndexedDB database here,
    //  check sentry if this may cause larger impact (we are logging old db name format as a warning temporarily)
  }

  /**
   * Resolve to a remote (direct server connection) database if the local database is not initialized yet
   * (e.g. for public form submissions without logged-in user session).
   */
  enableFallbackToRemote() {
    this.fallbackToRemote = true;
  }
}
