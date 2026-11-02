import { inject, Injectable, Injector, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { filter } from "rxjs/operators";
import PouchDB from "pouchdb-browser";
import { SessionInfo } from "../session/auth/session-info";
import { SyncState } from "../session/session-states/sync-state.enum";
import { computeDbNames, computeLegacyDbNames } from "./db-name-helpers";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "../alerts/alert.service";
import { Logging } from "../logging/logging.service";
import {
  LOCAL_STORAGE_TOKEN,
  NAVIGATOR_TOKEN,
  WINDOW_TOKEN,
} from "../../utils/di-tokens";
import { environment } from "../../../environments/environment";
import { Database } from "./database";
import {
  isReplicationConnectivityError,
  isReplicationUnauthorizedError,
  SyncedPouchDatabase,
} from "./pouchdb/synced-pouch-database";
import type { AnalyticsService } from "../analytics/analytics.service";
import { MultiTabDetectionService } from "./multi-tab-detection.service";

export interface DbConfig {
  dbNames: { app: string; notifications: string };
  adapter: string;
  /** The legacy DB is used and has to be migrated (see {@link IndexeddbMigrationService.startMigrationIfPending}) */
  migrationPending: boolean;
}

/**
 * The "indexeddb" adapter opens its IndexedDB databases with a version of at least 10^13
 * (see pouchdb-adapter-indexeddb), the legacy "idb" adapter with version 5.
 */
const MIN_INDEXEDDB_ADAPTER_VERSION = 10 ** 13;

function legacyDbConfig(
  session: SessionInfo,
  migrationPending: boolean,
): DbConfig {
  return {
    dbNames: computeLegacyDbNames(session),
    adapter: "idb",
    migrationPending,
  };
}

function newDbConfig(session: SessionInfo): DbConfig {
  return {
    dbNames: computeDbNames(session),
    adapter: "indexeddb",
    migrationPending: false,
  };
}

/** localStorage key of the flag that makes the app use the new DB */
function migratedFlagKey(session: SessionInfo): string {
  return "DB_MIGRATED_" + session.id;
}

/**
 * Whether the legacy and the new app DB have the same name and therefore are the same IndexedDB database.
 * This is the case if the user's token has no "username" claim, so that the session name falls back to the id.
 */
function legacyDbHasNewName(session: SessionInfo): boolean {
  return computeLegacyDbNames(session).app === computeDbNames(session).app;
}

/**
 * Manages the migration from the legacy PouchDB "idb" adapter to the newer "indexeddb" adapter,
 * and from username-based DB names to Keycloak-UUID-based DB names.
 *
 * The migration is non-blocking: the app continues to work on the legacy DB while a background
 * download from the server populates the new DB. Once the download and a sync of the legacy DB
 * are complete, the user is asked to reload. Only when the user confirms and a final sync has pushed
 * all local changes of the legacy DB to the server, the migration flag is set and the app reloads
 * into the new DB - so that no unsynced change is left behind in the legacy DB.
 * If anything fails, the app keeps using the legacy DB and the migration is retried on the next app start.
 *
 * If the legacy DB has the name of the new DB (see {@link legacyDbHasNewName}), the new DB cannot be
 * prepared in the background: opening the DB in use with the other adapter breaks it. Instead, the legacy DB
 * is deleted right after the final sync and the new DB is downloaded after the reload, like on a fresh login.
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
  private readonly injector = inject(Injector);
  private analyticsServicePromise?: Promise<AnalyticsService | null>;

  /**
   * Determine the database configuration (names + adapter) for the current session:
   * 1. use_indexeddb_adapter disabled → legacy DB (no migration; resets the migration flag)
   * 2. Migration flag set → new DB
   * 3. No legacy DB exists (fresh install) → new DB
   * 4. Otherwise → legacy DB, migration pending
   */
  async resolveDbConfig(session: SessionInfo): Promise<DbConfig> {
    if (!environment.use_indexeddb_adapter) {
      // The user works on the legacy DB from now on. If the flag is enabled again, the migration
      // and its final sync have to run again before switching back,
      // otherwise changes made on the legacy DB in the meantime and not yet synced would be left behind.
      this.localStorage.removeItem(migratedFlagKey(session));
      await this.logStep(
        "idb_indexeddb-disabled-config",
        "use_indexeddb_adapter disabled; using legacy DB",
      );
      return legacyDbConfig(session, false);
    }

    if (this.isMigrated(session)) {
      await this.logStep(
        "indexeddb_after-migration",
        "using new DB (migration flag set)",
      );
      return newDbConfig(session);
    }

    if (!(await this.legacyDbExists(session))) {
      this.setMigrated(session);
      await this.logStep(
        "indexeddb_fresh-install",
        "no legacy DB found; assuming fresh install and setting migration flag",
      );
      return newDbConfig(session);
    }

    await this.logStep(
      "idb_migration-pending",
      "using legacy DB (migration pending)",
    );
    return legacyDbConfig(session, true);
  }

  /**
   * Start the migration in the background, if it is pending and the database is synced with a server.
   *
   * @param session Current user session
   * @param db The database instance to migrate from (the "app" database)
   * @param dbConfig The configuration the database was opened with (see {@link resolveDbConfig})
   */
  startMigrationIfPending(
    session: SessionInfo,
    db: Database,
    dbConfig: DbConfig,
  ): void {
    if (!dbConfig.migrationPending || !(db instanceof SyncedPouchDatabase)) {
      return;
    }
    this.migrate(session, db).catch((err) =>
      Logging.error("IndexeddbMigration: migration failed", err),
    );
  }

  private async migrate(
    session: SessionInfo,
    legacyDb: SyncedPouchDatabase,
  ): Promise<void> {
    // we only migrate the "app" database; logic to track completed migration is simplified!
    const deleteLegacyDb = legacyDbHasNewName(session);

    const [newDbReady] = await Promise.all([
      deleteLegacyDb || this.downloadIntoNewDb(session, legacyDb),
      firstValueFrom(
        legacyDb.localSyncState.pipe(
          filter((state) => state === SyncState.COMPLETED),
        ),
      ),
    ]);
    if (!newDbReady) {
      return;
    }
    if (deleteLegacyDb && this.isOpenInOtherTabs()) {
      return this.logStep(
        "migration_skipped-multiple-tabs",
        "switch skipped while the app is open in other tabs; offered again on next app start",
      );
    }
    if (!(await this.userConfirmsSwitch(deleteLegacyDb))) {
      return this.logStep(
        "migration_reload-postponed",
        "switch postponed by user; offered again on next app start",
      );
    }

    // modal (cannot be closed), so that no further change is made on the legacy DB until the reload
    const progressDialog = this.confirmationDialog.showProgressDialog(
      signal(
        $localize`:Migration final sync progress:Syncing your latest changes before the upgrade ...`,
      ),
    );
    try {
      if (!(await this.syncLastChanges(legacyDb))) {
        return;
      }
      if (deleteLegacyDb && !(await this.deleteLegacyDb(legacyDb))) {
        return;
      }
    } finally {
      progressDialog.close();
    }

    this.setMigrated(session);
    this.window?.location.reload();
  }

  /**
   * Download all data from the server into the new DB.
   * Through a connection of its own, so that the download from scratch does not report
   * the documents the user may not read as lost permissions to the legacy DB's sync.
   *
   * @return whether the download completed (otherwise retried, from its checkpoint, on the next app start)
   */
  private async downloadIntoNewDb(
    session: SessionInfo,
    legacyDb: SyncedPouchDatabase,
  ): Promise<boolean> {
    // checked first, so that no connection to the server is opened (and left open) when offline
    const remoteDb = this.navigator?.onLine
      ? legacyDb.openRemoteReplicationSource()
      : undefined;
    if (!remoteDb) {
      Logging.debug(
        "IndexeddbMigration: download into new DB skipped (offline or no remote)",
      );
      return false;
    }

    const newDbName = computeDbNames(session).app;
    const newDb = this.createPouchDb(newDbName);
    try {
      await newDb.replicate.from(remoteDb, { batch_size: 500 });
      Logging.debug(`IndexeddbMigration: download into "${newDbName}" done`);
      return true;
    } catch (err) {
      if (
        !isReplicationConnectivityError(err) &&
        !isReplicationUnauthorizedError(err)
      ) {
        // e.g. storage quota exceeded on the device: reported to keep track of failing migrations
        Logging.warn(
          "IndexeddbMigration: download into new DB failed",
          { newDbName },
          err,
        );
      }
      await this.logStep(
        "migration_replication-failed",
        "download into new DB failed",
        err,
      );
      return false;
    } finally {
      for (const db of [remoteDb, newDb]) {
        db.close().catch((err) =>
          Logging.debug("IndexeddbMigration: failed to close db", err),
        );
      }
    }
  }

  /** A seam for tests, which must not create a real database. */
  private createPouchDb(name: string): PouchDB.Database {
    return new PouchDB(name, { adapter: "indexeddb" });
  }

  private async userConfirmsSwitch(deleteLegacyDb: boolean): Promise<boolean> {
    const answer = await (deleteLegacyDb
      ? this.confirmationDialog.getConfirmation(
          $localize`Database Upgrade Available`,
          $localize`To improve performance, the data on this device has to be downloaded from the server again once. Depending on the amount of data and your connection, this may take a while. Reload now to upgrade?`,
        )
      : this.confirmationDialog.getConfirmation(
          $localize`:Migration dialog title:Database Upgrade Ready`,
          $localize`:Migration dialog text:Your database has been upgraded for improved performance. Reload now to start using it?`,
        ));
    // closing the dialog (undefined) postpones the switch as well
    return answer === true;
  }

  /**
   * Push all local changes of the legacy DB to the server, which are not synced anymore after the switch.
   * @return whether all changes were synced
   */
  private async syncLastChanges(
    legacyDb: SyncedPouchDatabase,
  ): Promise<boolean> {
    try {
      await legacyDb.ensureSynced();
      return true;
    } catch (err) {
      // a failed sync has already been logged by the database itself
      this.alertService.addWarning(
        $localize`:Migration failed alert:The database upgrade could not be completed because your latest changes could not be synced to the server. Please check your internet connection. The upgrade will be tried again the next time you open the app.`,
      );
      await this.logStep(
        "migration_final-sync-failed",
        "final sync of legacy DB failed; keeping legacy DB",
        err,
      );
      return false;
    }
  }

  /**
   * Delete the legacy DB that has the name of the new DB, after its last changes were synced.
   * @return whether it was deleted
   */
  private async deleteLegacyDb(
    legacyDb: SyncedPouchDatabase,
  ): Promise<boolean> {
    // checked again: another tab may have been opened while the dialogs were shown
    if (this.isOpenInOtherTabs()) {
      await this.logStep(
        "migration_skipped-multiple-tabs",
        "legacy DB not deleted while the app is open in other tabs; offered again on next app start",
      );
      return false;
    }
    try {
      // also deletes the DBs of its indices (which have the names of the new DB's indices as well)
      // and its last sync (so that the download into the new DB is not taken for lost local data)
      await legacyDb.destroy();
    } catch (err) {
      // e.g. a broken IndexedDB on the device: the upgrade is offered again on next app start
      await this.logStep(
        "migration_legacy-db-deletion-failed",
        "failed to delete legacy DB",
        err,
      );
      // the legacy DB cannot be used anymore after its deletion was started: reopen it
      this.window?.location.reload();
      return false;
    }
    await this.logStep("migration_legacy-db-deleted", "legacy DB deleted");
    return true;
  }

  /** The legacy DB is not deleted while other tabs are open, whose unsynced changes would be lost. */
  private isOpenInOtherTabs(): boolean {
    return !!this.injector.get(MultiTabDetectionService, null)
      ?.isMultipleTabsOpen;
  }

  /**
   * Whether a legacy DB exists in IndexedDB (if this cannot be checked, assume it does: the safe default).
   */
  private async legacyDbExists(session: SessionInfo): Promise<boolean> {
    // PouchDB prefixes IndexedDB database names with "_pouch_"
    const name = `_pouch_${computeLegacyDbNames(session).app}`;
    // indexedDB.databases() is not available in all browsers
    const dbs = await this.window?.indexedDB
      ?.databases?.()
      .catch(() => undefined);
    if (!dbs) {
      return true;
    }
    // if the legacy DB has the name of the new DB, it may already be the new DB
    return dbs.some(
      (db) =>
        db.name === name && (db.version ?? 0) < MIN_INDEXEDDB_ADAPTER_VERSION,
    );
  }

  private isMigrated(session: SessionInfo): boolean {
    return this.localStorage.getItem(migratedFlagKey(session)) === "true";
  }

  private setMigrated(session: SessionInfo): void {
    this.localStorage.setItem(migratedFlagKey(session), "true");
  }

  /**
   * Log a step of the migration and track it as usage analytics event.
   * Never rejects: usage analytics must not interrupt the migration.
   */
  private async logStep(
    event: string,
    message: string,
    ...details: unknown[]
  ): Promise<void> {
    Logging.debug(`IndexeddbMigration: ${message}`, ...details);
    try {
      const analytics = await this.getAnalyticsService();
      analytics?.eventTrack(event, { category: "indexeddb_adapter_migration" });
    } catch (err) {
      Logging.debug("IndexeddbMigration: failed to track event", err);
    }
  }

  /**
   * Lazily resolves AnalyticsService to avoid circular module initialization issues
   * (a direct inject() would trigger a ConfigService → EntityMapperService cycle during tests).
   */
  private getAnalyticsService(): Promise<AnalyticsService | null> {
    this.analyticsServicePromise ??= import("../analytics/analytics.service")
      .then(({ AnalyticsService }) =>
        this.injector.get<AnalyticsService | null>(AnalyticsService, null),
      )
      .catch(() => null);
    return this.analyticsServicePromise;
  }
}
