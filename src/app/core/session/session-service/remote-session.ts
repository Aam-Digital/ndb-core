/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Injectable } from "@angular/core";
import { HttpStatusCode } from "@angular/common/http";
import { SessionService } from "./session.service";
import { LoginState } from "../session-states/login-state.enum";
import { PouchDatabase } from "../../database/pouch-database";
import { LoggingService } from "../../logging/logging.service";
import PouchDB from "pouchdb-browser";
import { AppSettings } from "../../app-settings";
import { AuthService } from "../auth/auth.service";
import { AuthUser } from "./auth-user";
import { LoginStateSubject, SyncStateSubject } from "../session-type";
import { Database } from "../../database/database";
import { SyncState } from "../session-states/sync-state.enum";

/**
 * Responsibilities:
 * - Hold the remote DB
 * - Handle auth against CouchDB
 * - provide "am I online"-info
 */
@Injectable()
export class RemoteSession extends SessionService {
  private readonly POUCHDB_SYNC_BATCH_SIZE = 500;
  private _liveSyncHandle: any;
  private _liveSyncScheduledHandle: any;
  private readonly remoteDB: PouchDatabase;
  private readonly localDB: PouchDatabase;
  private currentDBUser: AuthUser;

  /**
   * Create a RemoteSession and set up connection to the remote CouchDB server with valid authentication.
   */
  constructor(
    private loggingService: LoggingService,
    private authService: AuthService,
    private loginStateSubject: LoginStateSubject,
    private syncStateSubject: SyncStateSubject,
    database: Database,
  ) {
    super();
    this.remoteDB = new PouchDatabase(this.loggingService);
    if (database instanceof PouchDatabase) {
      this.localDB = database;
    }
  }

  /**
   * Connect to the remote Database. Tries to determine from a possible error whether the login was rejected or the user is offline.
   */
  public login() {
    this.authService.authenticate();
  }

  public async handleSuccessfulLogin(userObject: AuthUser) {
    this.remoteDB.initRemoteDB(
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
    this.currentDBUser = userObject;
    this.syncDatabases();
    this.loginStateSubject.next(LoginState.LOGGED_IN);
  }

  private syncDatabases() {
    console.log("syncing");
    // Call live syn even when initial sync fails
    return this.sync()
      .catch((err) => this.loggingService.error(`Sync failed: ${err}`))
      .finally(() => this.liveSyncDeferred());
  }
  public sync(): Promise<any> {
    console.log("normal sync");
    this.syncStateSubject.next(SyncState.STARTED);
    return this.localDB
      .getPouchDB()
      .sync(this.remoteDB.getPouchDB(), {
        batch_size: this.POUCHDB_SYNC_BATCH_SIZE,
      })
      .then(() => {
        console.log("sync done");
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
  public liveSync() {
    console.log("live sync");
    this.cancelLiveSync(); // cancel any liveSync that may have been alive before
    this.syncStateSubject.next(SyncState.STARTED);
    this._liveSyncHandle = this.localDB
      .getPouchDB()
      .sync(this.remoteDB.getPouchDB(), {
        live: true,
        retry: true,
      });
    this._liveSyncHandle
      .on("paused", () => {
        // replication was paused: either because sync is finished or because of a failed sync (mostly due to lost connection). info is empty.
        if (this.loginStateSubject.value === LoginState.LOGGED_IN) {
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
        const lastAuth = localStorage.getItem(AuthService.LAST_AUTH_KEY);
        this.loggingService.warn(
          `Live sync failed (last auth ${lastAuth}): ${JSON.stringify(info)}`,
        );
        this.liveSync();
      }
    };
  }

  /**
   * Schedules liveSync to be started.
   * This method should be used to start the liveSync after the initial non-live sync,
   * so the browser makes a round trip to the UI and hides the potentially visible first-sync dialog.
   * @param timeout ms to wait before starting the liveSync
   */
  public liveSyncDeferred(timeout = 1000) {
    this._liveSyncScheduledHandle = setTimeout(() => this.liveSync(), timeout);
  }
  /**
   * Cancels a currently running liveSync or a liveSync scheduled to start in the future.
   */
  public cancelLiveSync() {
    if (this._liveSyncScheduledHandle) {
      clearTimeout(this._liveSyncScheduledHandle);
    }
    if (this._liveSyncHandle) {
      this._liveSyncHandle.cancel();
    }
    this.syncStateSubject.next(SyncState.UNSYNCED);
  }

  private sendRequest(url: string, opts) {
    this.authService.addAuthHeader(opts.headers);
    return PouchDB.fetch(url, opts);
  }

  /**
   * Logout at the remote database.
   */
  public async logout(): Promise<void> {
    await this.authService.logout();
    this.currentDBUser = undefined;
    this.loginStateSubject.next(LoginState.LOGGED_OUT);
  }

  getCurrentUser(): AuthUser {
    return this.currentDBUser;
  }

  checkPassword(username: string, password: string): boolean {
    // Cannot be checked against CouchDB due to cookie-auth
    throw Error("Can't check password in remote session");
  }

  getDatabase(): PouchDatabase {
    return this.remoteDB;
  }
}
