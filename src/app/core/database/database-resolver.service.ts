import { inject, Injectable } from "@angular/core";
import { Database, DatabaseDocChange } from "./database";
import { SessionInfo } from "../session/auth/session-info";
import { DatabaseFactoryService } from "./database-factory.service";
import { Entity } from "../entity/model/entity";
import { Observable, Subject } from "rxjs";
import { NotificationEvent } from "app/features/notification/model/notification-event";
import { SyncedPouchDatabase } from "./pouchdb/synced-pouch-database";
import { PouchDatabase } from "./pouchdb/pouch-database";
import { RemotePouchDatabase } from "./pouchdb/remote-pouch-database";
import {
  DbConfig,
  IndexeddbMigrationService,
} from "./indexeddb-migration.service";
import { environment } from "../../../environments/environment";
import { SessionType } from "../session/session-type";
import { NAVIGATOR_TOKEN, WINDOW_TOKEN } from "#src/app/utils/di-tokens";
import { Logging } from "../logging/logging.service";
import { LOCAL_STORAGE_TOKEN } from "../../utils/di-tokens";

/**
 * Manages access to individual databases,
 * as data may be stored across multiple different instances.
 */
@Injectable({
  providedIn: "root",
})
export class DatabaseResolverService {
  private readonly localStorage = inject(LOCAL_STORAGE_TOKEN);
  private readonly databaseFactory = inject(DatabaseFactoryService);
  private readonly migrationService = inject(IndexeddbMigrationService);
  private readonly window = inject<Window>(WINDOW_TOKEN, { optional: true });
  private readonly navigator = inject<Navigator>(NAVIGATOR_TOKEN, {
    optional: true,
  });
  private sessionType: SessionType = environment.session_type;

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
    DatabaseResolverService.clearLastSyncMarkers();
    for (const db of this.databases.values()) {
      await db.destroy();
    }
  }

  /**
   * Static, so it cannot use the injected LOCAL_STORAGE_TOKEN and touches the
   * real localStorage directly. Callers that need this mockable should make it
   * an instance method first.
   */
  static clearLastSyncMarkers() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(SyncedPouchDatabase.LAST_SYNC_KEY_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Returns true when the `indexeddb` adapter (PouchDB 8+) is active.
   * On this adapter, `PouchDatabase.purge()` is supported so targeted document
   * removal is available. When false (legacy `idb` adapter), callers must fall
   * back to `destroyDatabases()` for full data hygiene.
   */
  isIndexedDbAdapterSupported(): boolean {
    return this.dbConfig?.adapter === "indexeddb";
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
    if (this.sessionType === SessionType.online) {
      this.initializeOnlineDatabaseForCurrentUser();
      return;
    }

    this.dbConfig = await this.migrationService.resolveDbConfig(session);

    // must run before init() below, which would (re-)create an empty database
    await this.checkForVanishedLocalDatabase(this.dbConfig);
    this.checkStorageHealth();

    this.initializeAppDatabaseForCurrentUser(session);
  }

  /**
   * Detect the local database missing from IndexedDB although a previous sync
   * was recorded on this device — i.e. locally stored data has vanished,
   * e.g. through browser storage eviction or manual deletion.
   *
   * Must run BEFORE the database is opened again (which recreates an empty DB
   * and would make this check always pass).
   */
  private async checkForVanishedLocalDatabase(dbConfig: DbConfig) {
    try {
      const dbName = dbConfig.dbNames.app;
      const lastSyncTime = this.localStorage.getItem(
        SyncedPouchDatabase.LAST_SYNC_KEY_PREFIX + dbName,
      );
      // indexedDB.databases() is not available in all browsers (then: undefined)
      const existingDbs = await this.window?.indexedDB?.databases?.();
      // PouchDB prefixes IndexedDB database names with "_pouch_" (all adapters)
      const dbExists = existingDbs?.some(
        (db) => db.name === `_pouch_${dbName}`,
      );

      Logging.addContext("Aam Digital local database", {
        dbName,
        adapter: dbConfig.adapter,
        dbExists,
        "last sync completed": lastSyncTime,
      });

      if (lastSyncTime && existingDbs && !dbExists) {
        Logging.error(
          "Local database is missing although a previous sync was recorded on this device - locally stored data was lost (possibly browser storage eviction)",
          {
            dbName,
            adapter: dbConfig.adapter,
            lastSyncCompleted: lastSyncTime,
            existingDbs: existingDbs.map((db) => db.name),
          },
        );
      }
    } catch (err) {
      Logging.debug("Could not check for vanished local database", err);
    }
  }

  /**
   * Request persistent storage (exempting the origin from the browser's
   * best-effort eviction under disk pressure / inactivity) and record storage
   * health (persistence permission and quota usage) as remote logging
   * context, to document the risk of browser storage eviction.
   *
   * The browser may silently deny the request (e.g. Chrome bases the grant on
   * a site engagement heuristic); this is best-effort and never blocks login.
   */
  private async checkStorageHealth() {
    try {
      const storage = this.navigator?.storage;
      if (!storage) {
        return;
      }

      // idempotent: resolves true immediately if the permission was already
      // granted, so this can safely run on every session without re-prompting
      const persisted = await storage.persist();
      Logging.debug(
        persisted
          ? "Persistent storage granted"
          : "Persistent storage request denied by browser",
      );

      const estimate = await storage.estimate?.();
      Logging.debug("Storage estimate", estimate);
      Logging.addContext("Aam Digital storage", {
        persisted,
        usage: estimate?.usage,
        quota: estimate?.quota,
      });
    } catch (err) {
      Logging.debug("Could not read/request storage health", err);
    }
  }

  private initializeOnlineDatabaseForCurrentUser() {
    const db = this.getDatabase(Entity.DATABASE);
    db.init();
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
      // only set adapter for local databases; RemotePouchDatabase (online mode) always uses HTTP
      db.adapter = this.dbConfig.adapter;
    }

    // In online mode, dbConfig is undefined, so browserDbName is undefined and
    // serverDbName is used directly — RemotePouchDatabase.init() with the server name is correct.
    const browserDbName = this.dbConfig?.dbNames?.notifications;
    const serverDbName = `${NotificationEvent.DATABASE}_${userId}`;
    if (db instanceof SyncedPouchDatabase) {
      db.init(browserDbName ?? serverDbName, serverDbName);
    } else {
      db.init(browserDbName ?? serverDbName);
    }

    // Notifications are not critical, therefore we ignore a pre-migration sync for that database
  }

  initDatabasesForAnonymous() {
    const db = this.getDatabase(Entity.DATABASE);
    if (db.isInitialized()) {
      return;
    }

    // The /public-form/ route is detected in bootstrap-environment.ts and
    // session_type is forced to "online" before Angular DI starts, so the
    // factory always produces a RemotePouchDatabase here. Init it with the
    // anonymous-session flag so a 401 doesn't trigger the Keycloak redirect.
    (db as RemotePouchDatabase).init(undefined, {
      unauthenticatedSession: true,
    });
  }
}
