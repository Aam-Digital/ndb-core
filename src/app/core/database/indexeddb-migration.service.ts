import { inject, Injectable, Injector, signal } from "@angular/core";
import { SessionInfo, SessionSubject } from "../session/auth/session-info";
import { SyncState } from "../session/session-states/sync-state.enum";
import { computeDbNames, computeLegacyDbNames } from "./db-name-helpers";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "../alerts/alert.service";
import { Logging } from "../logging/logging.service";
import {
  NAVIGATOR_TOKEN,
  WINDOW_TOKEN,
  LOCAL_STORAGE_TOKEN,
} from "../../utils/di-tokens";
import { filter, first } from "rxjs/operators";
import PouchDB from "pouchdb-browser";
import { environment } from "../../../environments/environment";
import { Database } from "./database";
import {
  isReplicationConnectivityError,
  isReplicationUnauthorizedError,
  SyncedPouchDatabase,
} from "./pouchdb/synced-pouch-database";
import type { AnalyticsService } from "../analytics/analytics.service";
import { LAST_SYNC_KEY_PREFIX } from "#src/bootstrap-reset";
import { MultiTabDetectionService } from "./multi-tab-detection.service";

export interface DbConfig {
  dbNames: { app: string; notifications: string };
  adapter: string;
}

const DB_MIGRATED_PREFIX = "DB_MIGRATED_";
/** The legacy "idb" DB has the name of the new DB and is deleted on the next start (see {@link hasIdenticalLegacyAppDbName}) */
const DB_LEGACY_DELETION_PENDING_PREFIX = "DB_LEGACY_DELETION_PENDING_";

/**
 * Whether the legacy and the new app database have the same name and therefore are the same IndexedDB database.
 * This is the case if the user's token has no "username" claim, so that the session name falls back to the id.
 * Such a database cannot be migrated to another adapter in the background, because it would have to be opened with both adapters.
 */
function hasIdenticalLegacyAppDbName(session: SessionInfo): boolean {
  return computeLegacyDbNames(session).app === computeDbNames(session).app;
}

/**
 * Manages the migration from the legacy PouchDB "idb" adapter to the newer "indexeddb" adapter,
 * and from username-based DB names to Keycloak-UUID-based DB names.
 *
 * The migration is non-blocking: the app continues to work on the old DB while a background
 * replication populates the new DB. Once both old-DB sync and new-DB replication are complete,
 * the user is prompted to reload. Only when the user confirms and a final sync has pushed all
 * local changes of the old DB to the server, the migration flag is set and the app reloads
 * into the new DB - so that no unsynced change is left behind in the old DB.
 *
 * If the legacy and the new DB have the same name (see {@link hasIdenticalLegacyAppDbName}),
 * the new DB cannot be prepared in the background. Instead, after the same final sync,
 * the legacy DB is deleted on the next start, before it is opened, and the new DB is downloaded
 * from the server like on a fresh login.
 */
@Injectable({ providedIn: "root" })
export class IndexeddbMigrationService {
  private readonly localStorage = inject(LOCAL_STORAGE_TOKEN);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly alertService = inject(AlertService);
  private readonly navigator = inject<Navigator>(NAVIGATOR_TOKEN, {
    optional: true,
  });
  private readonly window = inject<Window>(WINDOW_TOKEN, { optional: true });
  private readonly session = inject(SessionSubject, { optional: true });
  private readonly injector = inject(Injector);
  private analyticsServicePromise?: Promise<AnalyticsService | null>;

  /** Whether the last resolveDbConfig() determined migration is needed. */
  migrationPending = false;

  /**
   * Determine the database configuration (names + adapter) for the current session.
   *
   * Decision logic:
   * 1. use_indexeddb_adapter disabled → legacy names + "idb" adapter (no migration; resets the migration flags)
   * 2. Deletion of the legacy DB pending (legacy and new name are identical) → delete it, then continue with 3.
   * 3. Migration flag set → new names + "indexeddb"
   * 4. No old DB exists (fresh install) → new names + "indexeddb"
   * 5. Old DB exists, no flag → legacy names + "idb" (migration pending)
   */
  async resolveDbConfig(session: SessionInfo): Promise<DbConfig> {
    this.migrationPending = false; // reset pending flag on each resolve attempt

    if (!environment.use_indexeddb_adapter) {
      // The user works on the legacy DB from now on. If the flag is enabled again, the migration
      // (continuing from its checkpoint) and its final sync have to run again before switching back,
      // otherwise changes made on the legacy DB in the meantime and not yet synced would be left behind.
      this.localStorage.removeItem(DB_MIGRATED_PREFIX + session.id);
      this.localStorage.removeItem(
        DB_LEGACY_DELETION_PENDING_PREFIX + session.id,
      );
      await this.trackMigrationEvent("idb_indexeddb-disabled-config");
      Logging.debug(
        "IndexeddbMigration: use_indexeddb_adapter disabled; using legacy DB config",
      );
      return {
        dbNames: computeLegacyDbNames(session),
        adapter: "idb",
      };
    }

    if (
      this.localStorage.getItem(
        DB_LEGACY_DELETION_PENDING_PREFIX + session.id,
      ) === "true"
    ) {
      await this.deleteLegacyDbWithIdenticalName(session);
    }

    const oldDbExists = await this.legacyDbExists(session);
    if (!oldDbExists && !this.isMigrated(session)) {
      this.localStorage.setItem(DB_MIGRATED_PREFIX + session.id, "true");
      await this.trackMigrationEvent("indexeddb_fresh-install");
      Logging.debug(
        "IndexeddbMigration: no legacy DB found; assuming fresh install and setting 'migrated' flag",
      );

      return {
        dbNames: computeDbNames(session),
        adapter: "indexeddb",
      };
    }

    // Already migrated or fresh install (no old DB exists)
    if (this.isMigrated(session)) {
      await this.trackMigrationEvent("indexeddb_after-migration");
      Logging.debug(
        "IndexeddbMigration: using new DB config (migration flag set)",
      );
      return {
        dbNames: computeDbNames(session),
        adapter: "indexeddb",
      };
    }

    // Old DB exists, not yet migrated → use old DB, migration pending
    this.migrationPending = true;
    await this.trackMigrationEvent("idb_migration-pending");
    Logging.debug(
      "IndexeddbMigration: using legacy DB config (migration pending)",
    );
    return {
      dbNames: computeLegacyDbNames(session),
      adapter: "idb",
    };
  }

  /**
   * Start a background migration for the given database if migration is pending,
   * the database is a SyncedPouchDatabase, and we are online.
   *
   * Replicates all data from the remote CouchDB into a new local DB with the
   * "indexeddb" adapter and new naming scheme. Once both old-DB sync and new-DB
   * replication complete, the user is prompted to reload and switch to the new DB.
   * If anything fails, the migration flag stays unset and the app keeps using the old DB;
   * the migration is retried (continuing from its checkpoint) on the next app start.
   *
   * @param session Current user session
   * @param db The database instance to migrate from (the "app" database)
   */
  runBackgroundMigration(session: SessionInfo, db: Database): void {
    if (!this.migrationPending) {
      return;
    }
    if (!(db instanceof SyncedPouchDatabase)) {
      return;
    }
    if (hasIdenticalLegacyAppDbName(session)) {
      // the new DB cannot be prepared in the background:
      // opening the DB in use with the "indexeddb" adapter breaks its connection and every later access
      this.whenSynced(db, () => this.switchToNewDb(session, db, true));
      return;
    }
    // check for connectivity first, so that no remote connection is opened (and left open) when offline
    const remotePouchDB = this.navigator?.onLine
      ? db.openRemoteReplicationSource()
      : undefined;
    if (!remotePouchDB) {
      Logging.debug(
        "IndexeddbMigration: skipping background migration (offline or no remote)",
      );
      return;
    }

    const newDbNames = computeDbNames(session);

    // we only migrate the "app" database; logic to track completed migration is simplified!
    this.migrateDatabase(newDbNames["app"], remotePouchDB, db, session);
  }

  /**
   * @param remotePouchDB a connection of its own to the remote database (closed here once the replication ended),
   *                      so that the replication from scratch does not report lost permissions to the old DB's sync
   */
  private migrateDatabase(
    newDbName: string,
    remotePouchDB: PouchDB.Database,
    oldDb: SyncedPouchDatabase,
    session: SessionInfo,
  ): void {
    Logging.debug(
      `IndexeddbMigration: starting background replication into "${newDbName}"`,
    );

    const newDb = this.createPouchDb(newDbName);

    let replicationDone = false;
    let oldSyncDone = false;

    const checkBothComplete = () => {
      if (replicationDone && oldSyncDone) {
        this.closePouchDb(newDb);
        // we only migrate "app" DB for simplicity (no need to track separate migration states for all DBs)
        this.switchToNewDb(session, oldDb, false);
      }
    };

    // Background replication from remote → new local DB
    // (PouchDB's replication is only a thenable without `finally()`, so the source is closed in both handlers)
    newDb.replicate
      .from(remotePouchDB, { batch_size: 500 })
      .then(() => {
        this.closePouchDb(remotePouchDB);
        Logging.debug(
          `IndexeddbMigration: replication into "${newDbName}" completed`,
        );
        replicationDone = true;
        checkBothComplete();
      })
      .catch(async (err) => {
        this.closePouchDb(remotePouchDB);
        if (
          isReplicationConnectivityError(err) ||
          isReplicationUnauthorizedError(err)
        ) {
          // offline or session expired: nothing to fix, retried on next app start
          Logging.debug(
            "IndexeddbMigration: replication into new db failed (offline or session expired)",
            err,
          );
        } else {
          // e.g. storage quota exceeded on the device: reported to keep track of failing migrations
          Logging.warn(
            "IndexeddbMigration: replication into new db failed",
            { newDbName },
            err,
          );
        }
        this.closePouchDb(newDb);
        await this.trackMigrationEvent("migration_replication-failed");
      });

    // Wait for old DB to complete its initial sync
    this.whenSynced(oldDb, () => {
      oldSyncDone = true;
      checkBothComplete();
    });
  }

  /** Run the callback once the db completed a sync (immediately if it already has). */
  private whenSynced(db: SyncedPouchDatabase, callback: () => void): void {
    db.localSyncState
      .pipe(
        filter((state) => state === SyncState.COMPLETED),
        first(),
      )
      .subscribe(callback);
  }

  private createPouchDb(newDbName: string): PouchDB.Database {
    return new PouchDB(newDbName, { adapter: "indexeddb" });
  }

  private closePouchDb(db: PouchDB.Database): void {
    db.close().catch((err) =>
      Logging.debug("IndexeddbMigration: failed to close db", err),
    );
  }

  /**
   * Ask the user to reload into the new database.
   *
   * The migration flag (which makes the next app start use the new DB) is only set
   * after a final sync has pushed all local changes of the old DB to the server,
   * immediately before reloading. Otherwise, changes made on the old DB after the
   * migration completed (e.g. while working offline after postponing the reload)
   * would be left behind in the old DB, which is no longer synced after the switch.
   *
   * @param deleteLegacyDb the new DB has the name of the old one (see {@link hasIdenticalLegacyAppDbName}),
   *                       so the old DB is deleted on the next start and the new DB downloaded from the server then
   */
  private switchToNewDb(
    session: SessionInfo,
    oldDb: SyncedPouchDatabase,
    deleteLegacyDb: boolean,
  ): void {
    this.confirmAndSwitchToNewDb(session, oldDb, deleteLegacyDb).catch((err) =>
      Logging.error(
        "IndexeddbMigration: failed to switch to the new database",
        err,
      ),
    );
  }

  private async confirmAndSwitchToNewDb(
    session: SessionInfo,
    oldDb: SyncedPouchDatabase,
    deleteLegacyDb: boolean,
  ): Promise<void> {
    if (
      deleteLegacyDb &&
      this.injector.get(MultiTabDetectionService, null)?.isMultipleTabsOpen
    ) {
      // unsynced changes of another tab would be lost with the deleted DB
      Logging.debug(
        "IndexeddbMigration: switch to new db skipped while the app is open in other tabs; will be offered again on next app start",
      );
      await this.trackMigrationEvent("migration_skipped-multiple-tabs");
      return;
    }

    const confirmed = deleteLegacyDb
      ? await this.confirmationDialog.getConfirmation(
          $localize`:Migration dialog title (data downloaded again):Database Upgrade Available`,
          $localize`:Migration dialog text (data downloaded again):To improve performance, the data on this device has to be downloaded from the server again once. Depending on the amount of data and your connection, this may take a while. Reload now to upgrade?`,
        )
      : await this.confirmationDialog.getConfirmation(
          $localize`:Migration dialog title:Database Upgrade Ready`,
          $localize`:Migration dialog text:Your database has been upgraded for improved performance. Reload now to start using it?`,
        );
    if (!confirmed) {
      Logging.debug(
        "IndexeddbMigration: switch to new db postponed by user; will be offered again on next app start",
      );
      await this.trackMigrationEvent("migration_reload-postponed");
      return;
    }

    // modal (cannot be closed), so that no further change is made on the old DB during this final sync
    const progressRef = this.confirmationDialog.showProgressDialog(
      signal(
        $localize`:Migration final sync progress:Syncing your latest changes before the upgrade ...`,
      ),
    );
    try {
      await oldDb.ensureSynced();
    } catch (err) {
      // a failed sync has already been logged by the database itself
      Logging.debug(
        "IndexeddbMigration: final sync of old db failed; keeping old db",
        err,
      );
      this.alertService.addWarning(
        $localize`:Migration failed alert:The database upgrade could not be completed because your latest changes could not be synced to the server. Please check your internet connection. The upgrade will be tried again the next time you open the app.`,
      );
      await this.trackMigrationEvent("migration_final-sync-failed");
      return;
    } finally {
      progressRef.close();
    }

    if (deleteLegacyDb) {
      // deleted on the next start, before it is opened (see resolveDbConfig)
      this.localStorage.setItem(
        DB_LEGACY_DELETION_PENDING_PREFIX + session.id,
        "true",
      );
    } else {
      this.setMigrated(session);
    }
    this.window?.location.reload();
  }

  /**
   * Delete the legacy "idb" DB that has the name of the new DB, before it is opened,
   * and set the migration flag, so that the new DB is created and synced from the server.
   * Only called after a final sync pushed all local changes of the legacy DB (see confirmAndSwitchToNewDb).
   * If the deletion fails, the legacy DB is kept and the deletion is retried on the next start.
   */
  private async deleteLegacyDbWithIdenticalName(
    session: SessionInfo,
  ): Promise<void> {
    const indexedDBApi = this.window?.indexedDB;
    if (!indexedDBApi) {
      return;
    }
    // the name of the new DB, which the marked legacy DB has
    const dbName = computeDbNames(session).app;
    try {
      // PouchDB prefixes IndexedDB database names with "_pouch_"
      await this.deleteIndexedDb(indexedDBApi, `_pouch_${dbName}`);
    } catch (err) {
      // e.g. a broken IndexedDB on the device: retried on next start
      Logging.debug("IndexeddbMigration: failed to delete legacy db", err);
      await this.trackMigrationEvent("migration_legacy-db-deletion-failed");
      return;
    }

    // the new DB has the same name: its download is not a lost local database (see DatabaseResolverService)
    this.localStorage.removeItem(LAST_SYNC_KEY_PREFIX + dbName);
    this.setMigrated(session);
    this.localStorage.removeItem(
      DB_LEGACY_DELETION_PENDING_PREFIX + session.id,
    );
    Logging.debug(
      `IndexeddbMigration: deleted legacy db "${dbName}" to recreate it with the new adapter`,
    );
    await this.trackMigrationEvent("migration_legacy-db-deleted");
  }

  private isMigrated(session: SessionInfo): boolean {
    return (
      this.localStorage.getItem(DB_MIGRATED_PREFIX + session.id) === "true"
    );
  }

  private setMigrated(session: SessionInfo): void {
    this.localStorage.setItem(DB_MIGRATED_PREFIX + session.id, "true");
    Logging.debug(
      `IndexeddbMigration: migration flag set for user ${session.id}`,
    );
  }

  /** Never rejects: usage analytics must not interrupt the migration. */
  private async trackMigrationEvent(action: string): Promise<void> {
    try {
      const analytics = await this.getAnalyticsService();
      analytics?.eventTrack(action, {
        category: "indexeddb_adapter_migration",
      });
    } catch (err) {
      Logging.debug("IndexeddbMigration: failed to track event", err);
    }
  }

  /**
   * Lazily resolves AnalyticsService to avoid circular module initialization issues.
   * Direct inject() would trigger a ConfigService → EntityMapperService cycle during tests.
   */
  private getAnalyticsService(): Promise<AnalyticsService | null> {
    if (this.analyticsServicePromise === undefined) {
      this.analyticsServicePromise = import("../analytics/analytics.service")
        .then(({ AnalyticsService }) =>
          this.injector.get<AnalyticsService | null>(AnalyticsService, null),
        )
        .catch(() => null);
    }

    return this.analyticsServicePromise;
  }

  /**
   * Check whether a legacy (old-format) database exists in IndexedDB.
   * Uses the `indexedDB.databases()` API where available.
   */
  private async legacyDbExists(session: SessionInfo): Promise<boolean> {
    const legacyNames = computeLegacyDbNames(session);
    // PouchDB prefixes IndexedDB database names with "_pouch_"
    const expectedName = `_pouch_${legacyNames.app}`;

    const indexedDBApi = this.window?.indexedDB;
    if (!indexedDBApi) {
      Logging.debug(
        "IndexeddbMigration: window.indexedDB not available; assuming legacy DB may exist",
      );
      // If IndexedDB is not available (e.g. SSR), assume migration is needed (safe default)
      return true;
    }

    try {
      if (typeof indexedDBApi.databases === "function") {
        const dbs = await indexedDBApi.databases();
        return dbs.some((db) => db.name === expectedName);
      }
    } catch (e) {
      Logging.debug(
        "IndexeddbMigration: indexedDB.databases() not available",
        e,
      );
    }

    // If the API is not available, assume migration is needed (safe default)
    return true;
  }

  /**
   * Delete legacy IndexedDB databases after a successful migration.
   * Only runs if the migration flag is set for the given session.
   *
   * Currently not called. Will be added in a future release after users have had time to migrate, to clean up old databases and free up space.
   */
  async cleanupLegacyDatabases(
    session: SessionInfo = this.session.value,
  ): Promise<void> {
    if (!this.isMigrated(session)) {
      return;
    }

    const indexedDBApi = this.window?.indexedDB;
    if (!indexedDBApi) {
      Logging.debug(
        "IndexeddbMigration: window.indexedDB not available; skipping cleanup",
      );
      return;
    }

    const legacyNames = computeLegacyDbNames(session);
    const newNames = computeDbNames(session);
    const dbs = await indexedDBApi.databases();
    for (const [key, dbName] of Object.entries(legacyNames)) {
      if (dbName === newNames[key as keyof typeof newNames]) {
        // the "legacy" database is the one in use
        continue;
      }
      // PouchDB prefixes IndexedDB database names with "_pouch_"
      const idbName = `_pouch_${dbName}`;
      // delete any related DB (PouchDB adds some views as separate DBs with suffixes)
      const dbsToDelete = dbs.filter((db) => db.name.startsWith(idbName));

      for (const dbInfo of dbsToDelete) {
        try {
          await this.deleteIndexedDb(indexedDBApi, dbInfo.name);
          Logging.debug(
            `IndexeddbMigration: deleted legacy ${key} database "${dbInfo.name}"`,
          );
        } catch (e) {
          Logging.warn("IndexeddbMigration: failed to delete legacy database", {
            key,
            database: dbInfo.name,
            error: e,
          });
        }
      }
    }

    this.localStorage.removeItem(DB_MIGRATED_PREFIX + session.id);
    Logging.debug(
      `IndexeddbMigration: cleanup complete for user ${session.id}; migration flag removed`,
    );
  }

  private deleteIndexedDb(
    indexedDBApi: IDBFactory,
    name: string,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDBApi.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        // e.g. the app is still open in another tab: informational only
        Logging.debug(
          "IndexeddbMigration: deletion is blocked by open connections; resolving anyway",
          { database: name },
        );
        // Deletion will proceed once connections close; treat as non-fatal.
        resolve();
      };
    });
  }
}
