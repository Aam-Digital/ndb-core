import { PouchDatabase } from "./pouch-database";
import { Logging } from "../../logging/logging.service";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { RemotePouchDatabase } from "./remote-pouch-database";
import {
  debounceTime,
  filter,
  mergeMap,
  retry,
  takeWhile,
} from "rxjs/operators";
import { SyncState } from "../../session/session-states/sync-state.enum";
import {
  LoginStateSubject,
  SyncStateSubject,
} from "../../session/session-type";
import { from, interval, merge, of } from "rxjs";
import { Inject } from "@angular/core";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { LoginState } from "../../session/session-states/login-state.enum";

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

  constructor(
    dbName: string,
    authService: KeycloakAuthService,
    private syncStateSubject: SyncStateSubject,
    @Inject(NAVIGATOR_TOKEN) private navigator: Navigator,
    private loginStateSubject: LoginStateSubject,
  ) {
    super(dbName);

    this.remoteDatabase = new RemotePouchDatabase(dbName, authService);

    this.logSyncContext();
    this.syncStateSubject
      .pipe(filter((state) => state === SyncState.COMPLETED))
      .subscribe(() => {
        const lastSyncTime = new Date().toISOString();
        localStorage.setItem(this.LAST_SYNC_KEY, lastSyncTime);
        this.logSyncContext();
      });

    this.loginStateSubject
      .pipe(filter((state) => state === LoginState.LOGGED_IN))
      .subscribe(() => this.liveSync());
  }

  /**
   * Initializes the PouchDB with the http adapter to directly access a remote CouchDB without replication
   * See {@link https://pouchdb.com/adapters.html#pouchdb_over_http}
   * @param dbName (relative) path to the remote database
   */
  override init(dbName?: string) {
    super.init(dbName ?? this.dbName);

    // keep remote database on default name (e.g. "app" instead of "user_uuid-app")
    this.remoteDatabase.init();
  }

  private async logSyncContext() {
    const lastSyncTime = localStorage.getItem(this.LAST_SYNC_KEY);
    Logging.addContext("Aam Digital sync", {
      "last sync completed": lastSyncTime,
    });
  }

  /**
   * Execute a (one-time) sync between the local and server database.
   */
  sync(): Promise<SyncResult> {
    if (!this.navigator.onLine) {
      Logging.debug("Not syncing because offline");
      this.syncStateSubject.next(SyncState.UNSYNCED);
      return Promise.resolve({});
    }

    this.syncStateSubject.next(SyncState.STARTED);

    return this.getPouchDB()
      .sync(this.remoteDatabase.getPouchDB(), {
        batch_size: this.POUCHDB_SYNC_BATCH_SIZE,
      })
      .then((res) => {
        Logging.debug("sync completed", res);
        this.syncStateSubject.next(SyncState.COMPLETED);
        return res as SyncResult;
      })
      .catch((err) => {
        Logging.debug("sync error", err);
        this.syncStateSubject.next(SyncState.FAILED);
        throw err;
      });
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
      this.changes(""),
    )
      .pipe(
        debounceTime(500),
        mergeMap(() => {
          if (this.syncStateSubject.value == SyncState.STARTED) {
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
