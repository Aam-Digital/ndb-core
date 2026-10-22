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

export interface DbConfig {
  dbNames: { app: string; notifications: string };
  adapter: string;
}

const DB_MIGRATED_PREFIX = "DB_MIGRATED_";

/**
 * Manages the migration from the legacy PouchDB "idb" adapter to the newer "indexeddb" adapter,
 * and from username-based DB names to Keycloak-UUID-based DB names.
 *
 * The migration is non-blocking: the app continues to work on the old DB while a background
 * replication populates the new DB. Once both old-DB sync and new-DB replication are complete,
 * the user is prompted to reload. Only when the user confirms and a final sync has pushed all
 * local changes of the old DB to the server, the migration flag is set and the app reloads
 * into the new DB - so that no unsynced change is left behind in the old DB.
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
   * 1. use_indexeddb_adapter disabled → legacy names + "idb" adapter (no migration)
   * 2. Migration flag set → new names + "indexeddb"
   * 3. No old DB exists (fresh install) → new names + "indexeddb"
   * 4. Old DB exists, no flag → legacy names + "idb" (migration pending)
   */
  async resolveDbConfig(session: SessionInfo): Promise<DbConfig> {
    this.migrationPending = false; // reset pending flag on each resolve attempt

    if (!environment.use_indexeddb_adapter) {
      await this.trackMigrationEvent("idb_indexeddb-disabled-config");
      Logging.debug(
        "IndexeddbMigration: use_indexeddb_adapter disabled; using legacy DB config",
      );
      return {
        dbNames: computeLegacyDbNames(session),
        adapter: "idb",
      };
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
    const remotePouchDB = db.getRemotePouchDB();
    if (!remotePouchDB || !this.navigator?.onLine) {
      Logging.debug(
        "IndexeddbMigration: skipping background migration (offline or no remote)",
      );
      return;
    }

    const newDbNames = computeDbNames(session);

    // we only migrate the "app" database; logic to track completed migration is simplified!
    this.migrateDatabase(newDbNames["app"], remotePouchDB, db, session);
  }

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
        this.switchToNewDb(session, oldDb).catch((err) =>
          Logging.error(
            "IndexeddbMigration: failed to switch to the new database",
            err,
          ),
        );
      }
    };

    // Background replication from remote → new local DB
    newDb.replicate
      .from(remotePouchDB, { batch_size: 500 })
      .then(() => {
        Logging.debug(
          `IndexeddbMigration: replication into "${newDbName}" completed`,
        );
        replicationDone = true;
        checkBothComplete();
      })
      .catch(async (err) => {
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
    const oldDbSyncState = oldDb.localSyncState;
    if (oldDbSyncState.value === SyncState.COMPLETED) {
      oldSyncDone = true;
    } else {
      oldDbSyncState
        .pipe(
          filter((state) => state === SyncState.COMPLETED),
          first(),
        )
        .subscribe(() => {
          oldSyncDone = true;
          checkBothComplete();
        });
    }
  }

  private createPouchDb(newDbName: string): PouchDB.Database {
    return new PouchDB(newDbName, { adapter: "indexeddb" });
  }

  private closePouchDb(db: PouchDB.Database): void {
    db.close().catch((err) =>
      Logging.debug("IndexeddbMigration: failed to close new db", err),
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
   */
  private async switchToNewDb(
    session: SessionInfo,
    oldDb: SyncedPouchDatabase,
  ): Promise<void> {
    const confirmed = await this.confirmationDialog.getConfirmation(
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

    this.setMigrated(session);
    this.window?.location.reload();
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
    const dbs = await indexedDBApi.databases();
    for (const [key, dbName] of Object.entries(legacyNames)) {
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
        Logging.warn(
          "IndexeddbMigration: deletion is blocked by open connections; resolving anyway",
          { database: name },
        );
        // Deletion will proceed once connections close; treat as non-fatal.
        resolve();
      };
    });
  }
}
