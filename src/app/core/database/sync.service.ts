import { Inject, Injectable } from "@angular/core";
import { Database } from "./database";
import { PouchDatabase } from "./pouch-database";
import { Logging } from "../logging/logging.service";
import { SyncState } from "../session/session-states/sync-state.enum";
import { SyncStateSubject } from "../session/session-type";
import {
  debounceTime,
  filter,
  mergeMap,
  retry,
  takeWhile,
} from "rxjs/operators";
import { KeycloakAuthService } from "../session/auth/keycloak/keycloak-auth.service";
import { Config } from "../config/config";
import { Entity } from "../entity/model/entity";
import { from, interval, merge, of } from "rxjs";
import { environment } from "../../../environments/environment";
import { NAVIGATOR_TOKEN } from "../../utils/di-tokens";

/**
 * This service initializes the remote DB and manages the sync between the local and remote DB.
 */
@Injectable({
  providedIn: "root",
})
export class SyncService {
  static readonly LAST_SYNC_KEY = "LAST_SYNC";
  private readonly POUCHDB_SYNC_BATCH_SIZE = 500;
  static readonly SYNC_INTERVAL = 30000;

  private remoteDatabase: PouchDatabase;
  private remoteDB: PouchDB.Database;
  private localDB: PouchDB.Database;

  constructor(
    private database: Database,
    private authService: KeycloakAuthService,
    private syncStateSubject: SyncStateSubject,
    @Inject(NAVIGATOR_TOKEN) private navigator: Navigator,
  ) {
    this.remoteDatabase = new PouchDatabase(this.authService);

    this.logSyncContext();

    this.syncStateSubject
      .pipe(filter((state) => state === SyncState.COMPLETED))
      .subscribe(() => {
        const lastSyncTime = new Date().toISOString();
        localStorage.setItem(SyncService.LAST_SYNC_KEY, lastSyncTime);
        this.logSyncContext();
      });
  }

  private async logSyncContext() {
    const lastSyncTime = localStorage.getItem(SyncService.LAST_SYNC_KEY);
    const configRev = await this.database
      .get(Entity.createPrefixedId(Config.ENTITY_TYPE, Config.CONFIG_KEY))
      .catch(() => null)
      .then((config) => config?._rev);

    Logging.addContext("Aam Digital sync", {
      "last sync completed": lastSyncTime,
      "config _rev": configRev,
    });
  }

  /**
   * Initializes the remote DB and starts the sync
   */
  startSync() {
    this.initDatabases();
    this.liveSync();
  }

  /**
   * Create the remote DB and configure it to use correct cookies.
   * @private
   */
  private initDatabases() {
    this.remoteDatabase.initRemoteDB(
      `${environment.DB_PROXY_PREFIX}/${environment.DB_NAME}`,
    );
    this.remoteDB = this.remoteDatabase.getPouchDB();
    if (this.database instanceof PouchDatabase) {
      this.localDB = this.database.getPouchDB();
    }
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

    return this.localDB
      .sync(this.remoteDB, {
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
  private liveSync() {
    this.liveSyncEnabled = true;

    merge(
      // do an initial sync immediately
      of(true),
      // re-sync at regular interval
      interval(SyncService.SYNC_INTERVAL),
      // and immediately sync to upload any local changes
      this.database.changes(""),
    )
      .pipe(
        debounceTime(500),
        mergeMap(() => from(this.sync())),
        retry({ delay: SyncService.SYNC_INTERVAL }),
        takeWhile(() => this.liveSyncEnabled),
      )
      .subscribe();
  }
}

type SyncResult = PouchDB.Replication.SyncResultComplete<any>;
