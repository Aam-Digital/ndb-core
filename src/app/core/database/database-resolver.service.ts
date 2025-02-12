import { Injectable } from "@angular/core";
import { Database, DatabaseDocChange } from "./database";
import { SessionInfo } from "../session/auth/session-info";
import { DatabaseFactoryService } from "./database-factory.service";
import { Entity } from "../entity/model/entity";
import { Observable, Subject } from "rxjs";
import { NotificationEvent } from "app/features/notification/model/notification-event";
import { SyncedPouchDatabase } from "./pouchdb/synced-pouch-database";

/**
 * Manages access to individual databases,
 * as data may be stored across multiple different instances.
 */
@Injectable({
  providedIn: "root",
})
export class DatabaseResolverService {
  private databases: Map<string, Database> = new Map();

  /**
   * A stream of changes from all databases.
   * Use pipe() where necessary to filter for specific changes.
   */
  get changesFeed(): Observable<DatabaseDocChange> {
    return this._changesFeed.asObservable();
  }

  private _changesFeed: Subject<any>;

  constructor(private databaseFactory: DatabaseFactoryService) {
    this._changesFeed = new Subject();
  }

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

  async initDatabasesForSession(session: SessionInfo) {
    this.initializeAppDatabaseForCurrentUser(session);
    this.initializeNotificationsDatabaseForCurrentUser(session);
  }

  private initializeAppDatabaseForCurrentUser(user: SessionInfo) {
    const userDBName = `${user.name}-${Entity.DATABASE}`;
    this.getDatabase(Entity.DATABASE).init(userDBName);
  }

  private initializeNotificationsDatabaseForCurrentUser(user: SessionInfo) {
    const db = this.getDatabase(NotificationEvent.DATABASE);
    const serverDbName = `${NotificationEvent.DATABASE}_${user.id}`;
    const browserDbName = serverDbName;
    if (db instanceof SyncedPouchDatabase) {
      db.init(browserDbName, serverDbName);
    } else {
      db.init(browserDbName);
    }
  }

  initDatabasesForAnonymous() {
    if (!this.getDatabase(Entity.DATABASE).isInitialized()) {
      this.getDatabase(Entity.DATABASE).init(null);
    }
  }
}
