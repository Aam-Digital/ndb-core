import { inject, Injectable } from "@angular/core";
import { SessionInfo } from "../session/auth/session-info";
import { SyncStateSubject } from "../session/session-type";
import { SyncState } from "../session/session-states/sync-state.enum";
import { computeDbNames, computeLegacyDbNames } from "./db-name-helpers";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { Logging } from "../logging/logging.service";
import { NAVIGATOR_TOKEN, WINDOW_TOKEN } from "../../utils/di-tokens";
import { filter, first } from "rxjs/operators";
import PouchDB from "pouchdb-browser";
import { environment } from "../../../environments/environment";
import { Database } from "./database";
import { SyncedPouchDatabase } from "./pouchdb/synced-pouch-database";

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
 * a migration flag is set and the user is prompted to reload.
 */
@Injectable({ providedIn: "root" })
export class IndexeddbMigrationService {
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly navigator = inject<Navigator>(NAVIGATOR_TOKEN, {
    optional: true,
  });
  private readonly window = inject<Window>(WINDOW_TOKEN, { optional: true });

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

    // New adapter not enabled → use legacy adapter, no migration
    if (!environment.use_indexeddb_adapter) {
      return {
        dbNames: computeLegacyDbNames(session),
        adapter: "idb",
      };
    }

    // Already migrated or fresh install (no old DB exists)
    const oldDbExists = await this.legacyDbExists(session);
    if (this.isMigrated(session) || !oldDbExists) {
      return {
        dbNames: computeDbNames(session),
        adapter: "indexeddb",
      };
    }

    // Old DB exists, not yet migrated → use old DB, migration pending
    this.migrationPending = true;
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
   * replication complete, the migration flag is set and the user is prompted to reload.
   *
   * @param session Current user session
   * @param db The database instance to migrate from
   * @param dbKey Which database to migrate: "app" or "notifications"
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
    this.migrateDatabase(
      newDbNames["app"],
      remotePouchDB,
      db.localSyncState,
      session,
    );
  }

  private migrateDatabase(
    newDbName: string,
    remotePouchDB: PouchDB.Database,
    oldDbSyncState: SyncStateSubject,
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
        // we only migrate "app" DB for simplicity (no need to track separate migration states for all DBs)
        this.setMigrated(session);
        newDb.close();
        this.promptReload();
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
      .catch((err) => {
        Logging.warn(
          `IndexeddbMigration: replication into "${newDbName}" failed`,
          err,
        );
        newDb.close();
      });

    // Wait for old DB to complete its initial sync
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

  private async promptReload(): Promise<void> {
    const confirmed = await this.confirmationDialog.getConfirmation(
      $localize`:Migration dialog title:Database Upgrade Ready`,
      $localize`:Migration dialog text:Your database has been upgraded for improved performance. Reload now to start using it?`,
    );

    if (confirmed) {
      this.window?.location.reload();
    }
  }

  private isMigrated(session: SessionInfo): boolean {
    return localStorage.getItem(DB_MIGRATED_PREFIX + session.id) === "true";
  }

  private setMigrated(session: SessionInfo): void {
    localStorage.setItem(DB_MIGRATED_PREFIX + session.id, "true");
    Logging.debug(
      `IndexeddbMigration: migration flag set for user ${session.id}`,
    );
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
  async cleanupLegacyDatabases(session: SessionInfo): Promise<void> {
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
    for (const [key, dbName] of Object.entries(legacyNames)) {
      // PouchDB prefixes IndexedDB database names with "_pouch_"
      const idbName = `_pouch_${dbName}`;
      try {
        await this.deleteIndexedDb(indexedDBApi, idbName);
        Logging.debug(
          `IndexeddbMigration: deleted legacy ${key} database "${idbName}"`,
        );
      } catch (e) {
        Logging.warn(
          `IndexeddbMigration: failed to delete legacy ${key} database "${idbName}"`,
          e,
        );
      }
    }
  }

  private deleteIndexedDb(
    indexedDBApi: IDBFactory,
    name: string,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDBApi.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
