import { inject, Injectable, Injector, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { filter } from "rxjs/operators";
import { SessionInfo } from "../session/auth/session-info";
import { SyncState } from "../session/session-states/sync-state.enum";
import { computeDbNames, computeLegacyDbNames } from "./db-name-helpers";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { AlertService } from "../alerts/alert.service";
import { Logging } from "../logging/logging.service";
import { LOCAL_STORAGE_TOKEN, WINDOW_TOKEN } from "../../utils/di-tokens";
import { environment } from "../../../environments/environment";
import { Database } from "./database";
import { SyncedPouchDatabase } from "./pouchdb/synced-pouch-database";
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

/** The PouchDB DBs in IndexedDB, by the adapter that created them */
class ExistingDbs {
  constructor(private readonly dbs: IDBDatabaseInfo[]) {}

  isIdbAdapterDb(name: string): boolean {
    const db = this.find(name);
    return !!db && (db.version ?? 0) < MIN_INDEXEDDB_ADAPTER_VERSION;
  }

  isIndexeddbAdapterDb(name: string): boolean {
    const db = this.find(name);
    return !!db && (db.version ?? 0) >= MIN_INDEXEDDB_ADAPTER_VERSION;
  }

  private find(name: string): IDBDatabaseInfo | undefined {
    // PouchDB prefixes IndexedDB database names with "_pouch_"
    return this.dbs.find((db) => db.name === `_pouch_${name}`);
  }
}

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

/**
 * Migrates the local DB from the legacy PouchDB "idb" adapter and username-based name
 * to the "indexeddb" adapter and Keycloak-UUID-based name.
 *
 * After a final sync pushed all local changes of the legacy DB, so that none is left behind,
 * the legacy DB is deleted and the new DB downloaded from the server after a reload, like on a fresh login.
 * If anything fails, the app keeps the legacy DB and retries on the next app start.
 */
@Injectable({ providedIn: "root" })
export class IndexeddbMigrationService {
  private readonly localStorage = inject(LOCAL_STORAGE_TOKEN);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly alertService = inject(AlertService);
  private readonly window = inject<Window>(WINDOW_TOKEN, { optional: true });
  private readonly injector = inject(Injector);
  private analyticsServicePromise?: Promise<AnalyticsService | null>;

  /** Determine the names and the adapter of the current session's local DB. */
  async resolveDbConfig(session: SessionInfo): Promise<DbConfig> {
    const legacyAppDb = computeLegacyDbNames(session).app;
    const newAppDb = computeDbNames(session).app;
    const existingDbs = await this.findExistingDbs();

    if (!environment.use_indexeddb_adapter) {
      // if enabled again, the migration has to run again, so that changes made on the legacy DB meanwhile are synced
      this.localStorage.removeItem(migratedFlagKey(session));
      if (existingDbs?.isIndexeddbAdapterDb(legacyAppDb)) {
        // without "username" claim, the legacy name is the new one: this DB cannot be opened with "idb" anymore
        await this.logStep(
          "indexeddb_disabled-config-ignored",
          "use_indexeddb_adapter disabled, but the DB was already migrated; using new DB",
        );
        return newDbConfig(session);
      }
      await this.logStep(
        "idb_indexeddb-disabled-config",
        "use_indexeddb_adapter disabled; using legacy DB",
      );
      return legacyDbConfig(session, false);
    }

    if (existingDbs?.isIdbAdapterDb(newAppDb)) {
      // the account had no "username" claim when the DB was created (even if the migration flag is set)
      await this.logStep(
        "idb_migration-pending",
        "using legacy DB with the name of the new DB (migration pending)",
      );
      return {
        ...legacyDbConfig(session, true),
        dbNames: { ...computeLegacyDbNames(session), app: newAppDb },
      };
    }

    if (this.isMigrated(session)) {
      await this.logStep(
        "indexeddb_after-migration",
        "using new DB (migration flag set)",
      );
      return newDbConfig(session);
    }

    // if the existing DBs cannot be checked, assume a legacy DB exists (the safe default)
    if (existingDbs && !existingDbs.isIdbAdapterDb(legacyAppDb)) {
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
    await firstValueFrom(
      legacyDb.localSyncState.pipe(
        filter((state) => state === SyncState.COMPLETED),
      ),
    );
    if (this.isOpenInOtherTabs()) {
      return this.logStep(
        "migration_skipped-multiple-tabs",
        "switch skipped while the app is open in other tabs; offered again on next app start",
      );
    }
    if (!(await this.userConfirmsSwitch())) {
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
      // checked again: another tab may have been opened while the dialogs were shown
      if (this.isOpenInOtherTabs()) {
        this.alertService.addWarning(
          $localize`The database upgrade was postponed because the app is open in another tab. Close the other tabs to upgrade the next time you open the app.`,
        );
        return this.logStep(
          "migration_skipped-multiple-tabs-after-confirmation",
          "legacy DB not deleted while the app is open in other tabs; offered again on next app start",
        );
      }
      if (!(await this.deleteLegacyDbs(session, legacyDb))) {
        // the legacy DB cannot be used anymore after its deletion was started: reopen it
        this.window?.location.reload();
        return;
      }
    } finally {
      progressDialog.close();
    }

    // only the "app" DB is migrated: all new DBs are downloaded from the server after the reload
    this.setMigrated(session);
    // tabs the multi-tab check missed (e.g. long in the background) would keep using the deleted DB
    this.injector.get(MultiTabDetectionService, null)?.reloadOtherTabs();
    this.window?.location.reload();
  }

  private async userConfirmsSwitch(): Promise<boolean> {
    const answer = await this.confirmationDialog.getConfirmation(
      $localize`Database Upgrade Available`,
      $localize`To improve performance, the data on this device has to be downloaded from the server again once. Depending on the amount of data and your connection, this may take a while: please stay online until all data is loaded. Reload now to upgrade?`,
    );
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

  /** @return whether the legacy app DB was deleted */
  private async deleteLegacyDbs(
    session: SessionInfo,
    legacyDb: SyncedPouchDatabase,
  ): Promise<boolean> {
    try {
      // also deletes the DBs of its indices (which can have the names of the new DB's indices)
      await legacyDb.destroy();
    } catch (err) {
      // reported: unless the device's IndexedDB is broken, this is a bug that makes the upgrade fail on every app start
      Logging.warn("IndexeddbMigration: failed to delete legacy DB", err);
      await this.logStep(
        "migration_legacy-db-deletion-failed",
        "failed to delete legacy DB; offered again on next app start",
      );
      return false;
    }
    await this.logStep("migration_legacy-db-deleted", "legacy DB deleted");
    await this.deleteLegacyNotificationsDb(session);
    return true;
  }

  /** Its notifications are no longer synced. It has another name than the new DB, so a failure does not block the switch. */
  private async deleteLegacyNotificationsDb(
    session: SessionInfo,
  ): Promise<void> {
    const indexedDB = this.window?.indexedDB;
    if (!indexedDB) {
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(
          `_pouch_${computeLegacyDbNames(session).notifications}`,
        );
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        // if it is open in this tab, the "idb" adapter closes it, so only another connection blocks it
        request.onblocked = () => resolve();
      });
    } catch (err) {
      Logging.debug(
        "IndexeddbMigration: failed to delete legacy notifications DB",
        err,
      );
    }
  }

  /** whose unsynced changes would be lost with a deleted legacy DB */
  private isOpenInOtherTabs(): boolean {
    return !!this.injector.get(MultiTabDetectionService, null)
      ?.isMultipleTabsOpen;
  }

  /** @return the PouchDB DBs in IndexedDB, or undefined if they cannot be listed (not available in all browsers) */
  private async findExistingDbs(): Promise<ExistingDbs | undefined> {
    try {
      const dbs = await this.window?.indexedDB?.databases?.();
      return dbs && new ExistingDbs(dbs);
    } catch (err) {
      Logging.debug("IndexeddbMigration: cannot list IndexedDB DBs", err);
      return undefined;
    }
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
