import { inject, Injectable } from "@angular/core";
import { Database, DatabaseDocChange } from "./database";
import { SessionInfo } from "../session/auth/session-info";
import { DatabaseFactoryService } from "./database-factory.service";
import { Entity } from "../entity/model/entity";
import { Observable, Subject } from "rxjs";
import { NotificationEvent } from "app/features/notification/model/notification-event";
import { SyncedPouchDatabase } from "./pouchdb/synced-pouch-database";
import { PouchDatabase } from "./pouchdb/pouch-database";
import {
  DbConfig,
  IndexeddbMigrationService,
} from "./indexeddb-migration.service";

/**
 * Manages access to individual databases,
 * as data may be stored across multiple different instances.
 */
@Injectable({
  providedIn: "root",
})
export class DatabaseResolverService {
  private databaseFactory = inject(DatabaseFactoryService);
  private migrationService = inject(IndexeddbMigrationService);

  private databases: Map<string, Database> = new Map();

  /** Resolved DB config for the current session (set during initDatabasesForSession). */
  private dbConfig: DbConfig;

  /**
   * A stream of changes from all databases.
   * Use pipe() where necessary to filter for specific changes.
   */
  get changesFeed(): Observable<DatabaseDocChange> {
    return this._changesFeed.asObservable();
  }

  private _changesFeed: Subject<any> = new Subject();

  private registerDatabase(dbName: string) {
    const newDb = this.databaseFactory.createDatabase(dbName);
    this.databases.set(dbName, newDb);
    newDb.changes().subscribe((change) => this._changesFeed.next(change));
  }

  getDatabase(dbName: string = Entity.DATABASE): Database {
    if (!this.databases.has(dbName)) {
      this.registerDatabase(dbName);
    }

    let db = this.databases.get(dbName);
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

  /**
   * Clear sync checkpoint documents in all synced databases,
   * forcing a full re-check on the next sync without deleting any data.
   */
  async resetSync() {
    for (const db of this.databases.values()) {
      if (db instanceof SyncedPouchDatabase) {
        await db.resetSync();
      }
    }
  }

  /**
   * Connect the database(s) for the current user's "session",
   * i.e. configuring the access for that account after login
   * (especially for local and remote database modes)
   */
  async initDatabasesForSession(session: SessionInfo) {
    this.dbConfig = await this.migrationService.resolveDbConfig(session);
    this.initializeAppDatabaseForCurrentUser(session);
  }

  private initializeAppDatabaseForCurrentUser(user: SessionInfo) {
    const db = this.getDatabase(Entity.DATABASE);

    if (db instanceof PouchDatabase) {
      db.adapter = this.dbConfig.adapter;
    }

    db.init(this.dbConfig.dbNames.app);

    this.migrationService.runBackgroundMigration(user, db);
  }

  /**
   * Initialize db sync for current user's notifications-... DB.
   * Only call this if the user has notifications enabled and the CouchDB actually exists,
   * to avoid flooding to console with errors.
   * @param userId
   */
  public initializeNotificationsDatabaseForCurrentUser(userId: string) {
    const db = this.getDatabase(NotificationEvent.DATABASE);
    if (db.isInitialized()) {
      return;
    }

    if (db instanceof PouchDatabase && this.dbConfig) {
      db.adapter = this.dbConfig.adapter;
    }

    const browserDbName = this.dbConfig?.dbNames?.notifications;
    const serverDbName = `${NotificationEvent.DATABASE}_${userId}`;
    if (db instanceof SyncedPouchDatabase) {
      db.init(browserDbName ?? serverDbName, serverDbName);
    } else {
      db.init(browserDbName ?? serverDbName);
    }
  }

  initDatabasesForAnonymous() {
    if (!this.getDatabase(Entity.DATABASE).isInitialized()) {
      // this internally only uses the remote database of the SyncedPouchDatabase instance:
      this.getDatabase(Entity.DATABASE).init(null);
    }
  }
}
