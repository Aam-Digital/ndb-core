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
  /** The legacy DB is used and has to be migrated */
  migrationPending: boolean;
}

/** The IndexedDB version of DBs of the "indexeddb" adapter (the "idb" adapter uses 5) */
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

function migratedFlagKey(session: SessionInfo): string {
  return "DB_MIGRATED_" + session.id;
}

/** The case if the token has no "username" claim: the session name then falls back to the id */
function legacyDbHasNewName(session: SessionInfo): boolean {
  return computeLegacyDbNames(session).app === computeDbNames(session).app;
}

/**
 * Migrates the local DB from the legacy PouchDB "idb" adapter and username-based name
 * to the "indexeddb" adapter and Keycloak-UUID-based name.
 *
 * The app keeps working on the legacy DB while the new DB is downloaded in the background.
 * It only switches after a final sync pushed all local changes of the legacy DB, so that none is left behind.
 * If anything fails, it keeps the legacy DB and retries on the next app start.
 *
 * A legacy DB with the name of the new DB cannot be opened with the other adapter:
 * it is deleted after the final sync instead, and the new DB downloaded after the reload.
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

  /** Determine the names and the adapter of the current session's local DB. */
  async resolveDbConfig(session: SessionInfo): Promise<DbConfig> {
    if (!environment.use_indexeddb_adapter) {
      // if enabled again, the migration has to run again, so that changes made on the legacy DB meanwhile are synced
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

  /** @param db the "app" DB, opened with the dbConfig from {@link resolveDbConfig} */
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
    // only the "app" DB is migrated: the others start empty after the switch and are synced from the server
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
   * Through a connection of its own: the download from scratch reports all docs the user may not read
   * as lost permissions, which the legacy DB's sync would purge.
   * @return whether it completed (otherwise continued from its checkpoint on the next app start)
   */
  private async downloadIntoNewDb(
    session: SessionInfo,
    legacyDb: SyncedPouchDatabase,
  ): Promise<boolean> {
    // checked first, so that no connection is opened (and left open) when offline
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

  /** replaced in tests */
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

  /** @return whether all local changes of the legacy DB are on the server */
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
      // also deletes the DBs of its indices, which have the names of the new DB's indices as well
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

  /** whose unsynced changes would be lost with a deleted legacy DB */
  private isOpenInOtherTabs(): boolean {
    return !!this.injector.get(MultiTabDetectionService, null)
      ?.isMultipleTabsOpen;
  }

  /** If this cannot be checked, assume it does (the safe default). */
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

  /** Log and track the step as usage analytics event. Never rejects: analytics must not interrupt the migration. */
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

  /** Lazily, as inject() would cause a ConfigService → EntityMapperService cycle (replaced in tests). */
  private getAnalyticsService(): Promise<AnalyticsService | null> {
    this.analyticsServicePromise ??= import("../analytics/analytics.service")
      .then(({ AnalyticsService }) =>
        this.injector.get<AnalyticsService | null>(AnalyticsService, null),
      )
      .catch(() => null);
    return this.analyticsServicePromise;
  }
}
