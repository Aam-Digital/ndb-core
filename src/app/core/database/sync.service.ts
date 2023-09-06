import { Injectable } from "@angular/core";
import { Database } from "./database";
import { PouchDatabase } from "./pouch-database";
import { LoggingService } from "../logging/logging.service";
import { AppSettings } from "../app-settings";
import { HttpStatusCode } from "@angular/common/http";
import PouchDB from "pouchdb-browser";
import { SyncState } from "../session/session-states/sync-state.enum";
import { LoginStateSubject, SyncStateSubject } from "../session/session-type";
import { LoginState } from "../session/session-states/login-state.enum";
import { filter } from "rxjs/operators";
import { KeycloakAuthService } from "../session/auth/keycloak/keycloak-auth.service";

@Injectable({
  providedIn: "root",
})
export class SyncService {
  static readonly LAST_SYNC_KEY = "LAST_SYNC";
  private readonly POUCHDB_SYNC_BATCH_SIZE = 500;
  private _liveSyncHandle: any;
  private _liveSyncScheduledHandle: any;
  private remoteDB: PouchDB.Database;
  private localDB: PouchDB.Database;

  constructor(
    database: Database,
    private loggingService: LoggingService,
    private authService: KeycloakAuthService,
    private syncStateSubject: SyncStateSubject,
    private loginStateSubject: LoginStateSubject,
  ) {
    if (database instanceof PouchDatabase) {
      this.localDB = database.getPouchDB();
    }
    this.syncStateSubject
      .pipe(filter((state) => state === SyncState.COMPLETED))
      .subscribe(() =>
        localStorage.setItem(
          SyncService.LAST_SYNC_KEY,
          new Date().toISOString(),
        ),
      );
  }

  startSync() {
    this.initRemoteDB();
    return (
      this.sync()
        .catch((err) => this.loggingService.error(`Sync failed: ${err}`))
        // Call live sync even when initial sync fails
        .finally(() => this.liveSyncDeferred())
    );
  }

  private initRemoteDB() {
    const remoteDatabase = new PouchDatabase(this.loggingService);
    remoteDatabase.initRemoteDB(
      `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}`,
      (url, opts: any) => {
        if (typeof url === "string") {
          const remoteUrl =
            AppSettings.DB_PROXY_PREFIX +
            url.split(AppSettings.DB_PROXY_PREFIX)[1];
          return this.sendRequest(remoteUrl, opts).then((initialRes) =>
            // retry login if request failed with unauthorized
            initialRes.status === HttpStatusCode.Unauthorized
              ? this.authService
                  .autoLogin()
                  .then(() => this.sendRequest(remoteUrl, opts))
                  // return initial response if request failed again
                  .then((newRes) => (newRes.ok ? newRes : initialRes))
                  .catch(() => initialRes)
              : initialRes,
          );
        }
      },
    );
  }

  private sendRequest(url: string, opts) {
    this.authService.addAuthHeader(opts.headers);
    return PouchDB.fetch(url, opts);
  }

  private sync(): Promise<any> {
    this.syncStateSubject.next(SyncState.STARTED);
    return this.localDB
      .sync(this.remoteDB, {
        batch_size: this.POUCHDB_SYNC_BATCH_SIZE,
      })
      .then(() => {
        this.syncStateSubject.next(SyncState.COMPLETED);
      })
      .catch((err) => {
        this.syncStateSubject.next(SyncState.FAILED);
        throw err;
      });
  }

  /**
   * Start live sync in background.
   */
  private liveSync() {
    this.cancelLiveSync(); // cancel any liveSync that may have been alive before
    this.syncStateSubject.next(SyncState.STARTED);
    this._liveSyncHandle = this.localDB.sync(this.remoteDB, {
      live: true,
      retry: true,
    });
    this._liveSyncHandle
      .on("paused", () => {
        // replication was paused: either because sync is finished or because of a failed sync (mostly due to lost connection). info is empty.
        if (this.isLoggedIn()) {
          this.syncStateSubject.next(SyncState.COMPLETED);
          // We might end up here after a failed sync that is not due to offline errors.
          // It shouldn't happen too often, as we have an initial non-live sync to catch those situations, but we can't find that out here
        }
      })
      .on("active", () => {
        // replication was resumed: either because new things to sync or because connection is available again. info contains the direction
        this.syncStateSubject.next(SyncState.STARTED);
      })
      .on("error", this.handleFailedSync())
      .on("complete", (info) => {
        this.loggingService.info(
          `Live sync completed: ${JSON.stringify(info)}`,
        );
        this.syncStateSubject.next(SyncState.COMPLETED);
      });
  }

  private handleFailedSync() {
    return (info) => {
      if (this.isLoggedIn()) {
        this.syncStateSubject.next(SyncState.FAILED);
        const lastAuth = localStorage.getItem(
          KeycloakAuthService.LAST_AUTH_KEY,
        );
        this.loggingService.warn(
          `Live sync failed (last auth ${lastAuth}): ${JSON.stringify(info)}`,
        );
        this.liveSync();
      }
    };
  }

  private isLoggedIn(): boolean {
    return this.loginStateSubject.value === LoginState.LOGGED_IN;
  }

  /**
   * Schedules liveSync to be started.
   * This method should be used to start the liveSync after the initial non-live sync,
   * so the browser makes a round trip to the UI and hides the potentially visible first-sync dialog.
   * @param timeout ms to wait before starting the liveSync
   */
  private liveSyncDeferred(timeout = 1000) {
    this._liveSyncScheduledHandle = setTimeout(() => this.liveSync(), timeout);
  }

  /**
   * Cancels a currently running liveSync or a liveSync scheduled to start in the future.
   */
  private cancelLiveSync() {
    if (this._liveSyncScheduledHandle) {
      clearTimeout(this._liveSyncScheduledHandle);
    }
    if (this._liveSyncHandle) {
      this._liveSyncHandle.cancel();
    }
    this.syncStateSubject.next(SyncState.UNSYNCED);
  }
}
