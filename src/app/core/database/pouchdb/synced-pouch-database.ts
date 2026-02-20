import { PouchDatabase } from "./pouch-database";
import { Logging } from "../../logging/logging.service";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { NgZone } from "@angular/core";
import { RemotePouchDatabase } from "./remote-pouch-database";
import {
  debounceTime,
  filter,
  mergeMap,
  retry,
  takeUntil,
  takeWhile,
} from "rxjs/operators";
import { SyncState } from "../../session/session-states/sync-state.enum";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "../../session/session-type";
import { from, interval, merge, of } from "rxjs";
import { LoginState } from "../../session/session-states/login-state.enum";
import { NotAvailableOfflineError } from "../../session/not-available-offline.error";

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

  POUCHDB_SYNC_BATCH_SIZE = 500;
  SYNC_INTERVAL = 30000;

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
    private navigator: Navigator,
    private loginStateSubject: LoginStateSubject,
    ngZone?: NgZone,
  ) {
    super(dbName, globalSyncState, ngZone);

    this.remoteDatabase = new RemotePouchDatabase(
      dbName,
      authService,
      undefined,
      ngZone,
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
      this.remoteDatabase.init(null, true);
      // use the remote database as internal database driver
      this.pouchDB = this.remoteDatabase.getPouchDB();
      this.databaseInitialized.complete();
    } else {
      super.init(dbName ?? this.dbName, undefined, true);

      // keep remote database on default name (e.g. "app" instead of "user_uuid-app")
      this.remoteDatabase.init(remoteDbName);
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
  sync(options: PouchDB.Replication.SyncOptions = {}): Promise<SyncResult> {
    if (!this.navigator.onLine) {
      Logging.debug("Not syncing because offline");
      this.syncState.next(SyncState.UNSYNCED);
      return Promise.resolve({});
    }

    this.syncState.next(SyncState.STARTED);

    return this.getPouchDB()
      .sync(this.remoteDatabase.getPouchDB(), {
        batch_size: this.POUCHDB_SYNC_BATCH_SIZE,
        ...options,
      })
      .then((res) => {
        if (res) res["dbName"] = this.dbName; // add for debugging information
        Logging.debug("sync completed", res);
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

        Logging.debug("sync error", err);
        this.syncState.next(SyncState.FAILED);
        throw err;
      });
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
            return of();
          } else {
            return from(this.sync());
          }
        }),
        retry({ delay: this.SYNC_INTERVAL }),
        takeWhile(() => this.liveSyncEnabled),
      )
      .subscribe();
  }
}

type SyncResult = PouchDB.Replication.SyncResultComplete<any>;
