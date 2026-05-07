import { PouchDatabase } from "./pouch-database";
import { Logging } from "../../logging/logging.service";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { NgZone } from "@angular/core";
import { RemotePouchDatabase } from "./remote-pouch-database";
import {
  debounceTime,
  filter,
  mergeMap,
  takeUntil,
  takeWhile,
} from "rxjs/operators";
import { SyncState } from "../../session/session-states/sync-state.enum";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "../../session/session-type";
import { EMPTY, from, interval, merge, of } from "rxjs";
import { LoginState } from "../../session/session-states/login-state.enum";
import { NotAvailableOfflineError } from "../../session/not-available-offline.error";
import { AlertService } from "../../alerts/alert.service";
import { QueryOptions } from "../database";
import {
  PouchdbCorruptionRecoveryService,
  isKnownMultiTabDatabaseCorruption,
} from "./pouchdb-corruption-recovery.service";

/**
 * An alternative implementation of PouchDatabase that additionally
 * provides functionality to sync with a remote CouchDB.
 */
export class SyncedPouchDatabase extends PouchDatabase {
  static LAST_SYNC_KEY_PREFIX = "LAST_SYNC_";

  get LAST_SYNC_KEY(): string | undefined {
    if (!this.pouchDB?.name) {
      return undefined;
    }
    return SyncedPouchDatabase.LAST_SYNC_KEY_PREFIX + this.pouchDB.name;
  }

  POUCHDB_SYNC_BATCH_SIZE = 100;
  SYNC_INTERVAL = 30000;

  private readonly navigator: Navigator;
  private readonly loginStateSubject: LoginStateSubject;
  private readonly alertService?: AlertService;
  private readonly corruptionRecovery?: PouchdbCorruptionRecoveryService;
  private remoteDatabase: RemotePouchDatabase;
  private syncState: SyncStateSubject = new SyncStateSubject();

  /**
   * Get the internal sync state subject for this database (not the global one).
   * Useful for observing when this specific database's sync completes.
   */
  get localSyncState(): SyncStateSubject {
    return this.syncState;
  }

  /**
   * Get the underlying remote PouchDB instance.
   * Can be used as a replication source for background migration.
   */
  getRemotePouchDB(): PouchDB.Database {
    return this.remoteDatabase?.getPouchDB();
  }

  constructor(
    dbName: string,
    authService: KeycloakAuthService,
    globalSyncState: SyncStateSubject,
    navigator: Navigator,
    loginStateSubject: LoginStateSubject,
    ngZone?: NgZone,
    alertService?: AlertService,
    corruptionRecovery?: PouchdbCorruptionRecoveryService,
  ) {
    super(dbName, globalSyncState, ngZone);
    this.navigator = navigator;
    this.loginStateSubject = loginStateSubject;
    this.alertService = alertService;
    this.corruptionRecovery = corruptionRecovery;

    this.remoteDatabase = new RemotePouchDatabase(
      dbName,
      authService,
      undefined,
      ngZone,
      this.alertService,
    );

    this.logSyncContext();
    this.syncState
      .pipe(
        takeUntil(this.destroy$),
        filter((state) => state === SyncState.COMPLETED),
      )
      .subscribe(() => {
        const lastSyncTime = new Date().toISOString();
        localStorage.setItem(this.LAST_SYNC_KEY, lastSyncTime);
        this.logSyncContext();
      });

    // forward sync state to global sync state (combining state from all synced databases)
    this.syncState
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: SyncState) => this.globalSyncState.next(state));

    // Start live sync whenever the user is logged in.
    // Note: if the user logged in offline (no Keycloak token), syncing will
    // hit a 401 and the RemotePouchDatabase fetch interceptor will trigger a
    // Keycloak login redirect. This is intentional — we want users to
    // authenticate online when connectivity is available.
    this.loginStateSubject
      .pipe(
        takeUntil(this.destroy$),
        filter((state) => state === LoginState.LOGGED_IN),
      )
      .subscribe(() => this.liveSync());
  }

  /**
   * Initializes the PouchDB with local indexeddb as well as a remote server connection for syncing.
   * @param dbName local database name (for the current user);
   *                if explicitly passed as `null`, a remote-only, anonymous session is initialized
   * @param remoteDbName (optional) remote database name (if different from local browser database name)
   */
  override init(dbName?: string | null, remoteDbName?: string) {
    if (dbName === null) {
      Logging.debug(
        "Initializing remote-only session for database",
        this.dbName,
      );

      this.remoteDatabase.init(null, { unauthenticatedSession: true });

      // use the remote database as internal database driver
      this.pouchDB = this.remoteDatabase.getPouchDB();
      this.databaseInitialized.complete();
    } else {
      super.init(dbName ?? this.dbName, undefined, true);

      // keep remote database on default name (e.g. "app" instead of "user_uuid-app")
      this.remoteDatabase.init(remoteDbName, { trackLostPermissions: true });
    }
  }

  private async logSyncContext() {
    const lastSyncTime = localStorage.getItem(this.LAST_SYNC_KEY);
    Logging.addContext("Aam Digital sync", {
      "last sync completed": lastSyncTime,
    });
  }

  /**
   * Whether the database is currently in remote-only mode without syncing to a local PouchDB.
   */
  public get isInRemoteOnlyMode(): boolean {
    return this.pouchDB === this.remoteDatabase.getPouchDB();
  }

  protected override async subscribeChanges() {
    // if in remote-only mode, forward remote database changes to this changes feed
    if (this.isInRemoteOnlyMode) {
      this.remoteDatabase
        .changes()
        .pipe(takeUntil(this.destroy$))
        .subscribe((change) => this.changesFeed.next(change));
    } else {
      super.subscribeChanges();
    }
  }

  /**
   * Execute a (one-time) sync between the local and server database.
   */
  async sync(
    options: PouchDB.Replication.SyncOptions = {},
  ): Promise<SyncResult> {
    if (!this.navigator.onLine) {
      Logging.debug("Not syncing because offline");
      this.syncState.next(SyncState.UNSYNCED);
      return {};
    }

    const localInfo = await this.getPouchDB().info();
    const isFirstSync = localInfo.doc_count === 0;
    if (isFirstSync) {
      // On first sync there are no local docs, so skip lost-permission tracking & purge
      this.remoteDatabase.trackLostPermissions = false;
    }

    this.syncState.next(SyncState.STARTED);

    // Track the last batch of synced doc IDs for diagnostics on write failures
    let lastSyncedDocIds: string[] = [];

    // Run PouchDB sync/replication outside Angular zone to:
    //  - avoid wasted change-detection cycles for internal sync chatter
    //  - prevent expected internal rejections (e.g. transient 404s for
    //    not-yet-existing remote DBs) from being routed to Angular's
    //    ErrorHandler / Sentry. Outer .then/.catch below still handle them
    //    explicitly and re-enter the zone for state updates.
    const createSyncHandler = () =>
      this.getPouchDB().sync(this.remoteDatabase.getPouchDB(), {
        batch_size: this.POUCHDB_SYNC_BATCH_SIZE,
        ...options,
      });
    const syncHandler = this.ngZone
      ? this.ngZone.runOutsideAngular(createSyncHandler)
      : createSyncHandler();

    syncHandler.on("change", (info) => {
      lastSyncedDocIds =
        info?.change?.docs?.map((d) => d._id).filter(Boolean) ?? [];
    });

    return syncHandler
      .then(async (res) => {
        if (res) res["dbName"] = this.dbName; // add for debugging information
        Logging.debug("sync completed", res);
        if (!isFirstSync) {
          await this.purgeDocsWithLostPermissions();
        }
        this.syncState.next(SyncState.COMPLETED);
        return res as SyncResult;
      })
      .catch((err) => {
        // Handle 404 errors for notifications database (may not exist yet if no event was triggered)
        if (this.isNotificationsDatabase() && err?.status === 404) {
          Logging.debug(
            "Notifications database does not exist yet on server - this may be expected",
            err,
          );
          this.syncState.next(SyncState.COMPLETED);
          return {};
        }

        if (this.isDocumentWriteError(err)) {
          Logging.warn(
            `sync failed: document write error (possible oversized document)`,
            { db: this.dbName, lastSyncedBatch: lastSyncedDocIds },
            err,
          );
        } else if (isKnownMultiTabDatabaseCorruption(err)) {
          this.corruptionRecovery?.handleKnownMultiTabCorruption(
            err,
            `sync failed [${this.dbName}]: likely multi-tab IndexedDB corruption. Last synced batch: [${lastSyncedDocIds.join(", ")}]`,
          );
        } else {
          Logging.warn(`sync failed`, { db: this.dbName }, err);
        }
        this.syncState.next(SyncState.FAILED);
        throw err;
      })
      .finally(() => {
        if (isFirstSync) {
          this.remoteDatabase.trackLostPermissions = true;
        }
      });
  }

  override async put(object: any, forceOverwrite = false): Promise<any> {
    try {
      return await super.put(object, forceOverwrite);
    } catch (err) {
      this.corruptionRecovery?.handleKnownMultiTabCorruption(
        err,
        `put failed [${this.dbName}]: likely multi-tab IndexedDB corruption`,
      );
      throw err;
    }
  }

  override query(
    fun: string | ((doc: any, emit: any) => void),
    options: QueryOptions,
  ): Promise<any> {
    return super.query(fun, options).catch((err) => {
      this.corruptionRecovery?.handleKnownMultiTabCorruption(
        err,
        `query failed [${this.dbName}]: likely multi-tab IndexedDB corruption`,
      );
      throw err;
    });
  }

  private isDocumentWriteError(err: any): boolean {
    const message = err?.message || err?.reason || String(err);
    return (
      message.includes("Maximum call stack size exceeded") ||
      message.includes("IDBObjectStore") ||
      message.includes("Failed to execute")
    );
  }

  /**
   * Purge local documents for which the server reported lost permissions
   * during the most recent sync's `_changes` calls.
   */
  private async purgeDocsWithLostPermissions(): Promise<void> {
    const lostPermissionIds = this.remoteDatabase
      .collectAndClearLostPermissions()
      // design docs for indices are managed locally (and shouldn't be synced anyway)
      .filter((id) => !id.startsWith("_design/"));

    for (const _id of lostPermissionIds) {
      try {
        const purged = await this.purge(_id);
        if (purged) {
          Logging.debug(`Purged doc with lost permissions: ${_id}`);
        } else {
          Logging.debug(`Skipped purge for ${_id} (does not exist locally)`);
        }
      } catch (err) {
        Logging.warn(`Error trying to purge doc`, _id, err);
      }
    }
  }

  /**
   * Force a full re-check against the remote DB without deleting local data.
   * Uses `checkpoint: false` once so PouchDB ignores previous checkpoints for this run.
   */
  async resetSync(): Promise<void> {
    if (this.isInRemoteOnlyMode) {
      return;
    }

    Logging.debug(`triggering full re-sync for "${this.dbName}"`);
    await this.sync({ checkpoint: false });
  }

  /**
   * Ensure the database is synced with the remote server.
   * Resolves immediately if in remote-only mode.
   * Throws {@link NotAvailableOfflineError} if offline.
   * Otherwise triggers a one-time sync and resolves when complete.
   */
  async ensureSynced(): Promise<void> {
    if (this.isInRemoteOnlyMode) {
      return;
    }

    if (!this.navigator.onLine) {
      throw new NotAvailableOfflineError(
        "Failed to ensure synced. Cannot sync database while offline.",
      );
    }

    await this.sync();

    if (this.syncState.value === SyncState.UNSYNCED) {
      throw new NotAvailableOfflineError(
        "Failed to ensure synced. SyncState still reported as UNSYNCED.",
      );
    }
  }

  /**
   * Continuous syncing in background.
   */
  liveSyncEnabled: boolean;

  liveSync() {
    this.liveSyncEnabled = true;

    merge(
      // do an initial sync immediately
      of(true),
      // re-sync at regular interval
      interval(this.SYNC_INTERVAL),
      // and immediately sync to upload any local changes
      this.changes(),
    )
      .pipe(
        debounceTime(500),
        mergeMap(() => {
          if (this.syncState.value == SyncState.STARTED) {
            return EMPTY;
          } else {
            // catch errors so the outer observable stays alive without re-subscribing
            // (re-subscribing via retry would leak EventEmitter listeners on PouchDB)
            // sync() already logs errors and updates syncState before re-throwing
            return from(
              this.sync().catch((err) => {
                Logging.debug("liveSync: swallowed sync error", err);
              }),
            );
          }
        }),
        takeWhile(() => this.liveSyncEnabled),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }
}

type SyncResult = PouchDB.Replication.SyncResultComplete<any>;
