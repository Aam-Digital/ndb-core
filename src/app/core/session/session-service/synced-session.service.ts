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

import { Inject, Injectable } from "@angular/core";

import { SessionService } from "./session.service";
import { LocalSession } from "./local-session";
import { RemoteSession } from "./remote-session";
import { LoginState } from "../session-states/login-state.enum";
import { Database } from "../../database/database";
import { SyncState } from "../session-states/sync-state.enum";
import { LoggingService } from "../../logging/logging.service";
import { waitForChangeTo } from "../session-states/session-utils";
import { filter } from "rxjs/operators";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { AuthService } from "../auth/auth.service";
import { AuthUser } from "./auth-user";

/**
 * A synced session creates and manages a LocalSession and a RemoteSession
 * and handles the setup of synchronisation.
 *
 * also see
 * [Session Handling, Authentication & Synchronisation]{@link /additional-documentation/concepts/session-and-authentication-system.html}
 */
@Injectable()
export class SyncedSessionService extends SessionService {
  static readonly LAST_SYNC_KEY = "LAST_SYNC";
  private readonly POUCHDB_SYNC_BATCH_SIZE = 500;

  private _liveSyncHandle: any;
  private _liveSyncScheduledHandle: any;
  private _offlineRetryLoginScheduleHandle: any;

  constructor(
    private loggingService: LoggingService,
    private localSession: LocalSession,
    private remoteSession: RemoteSession,
    private authService: AuthService,
    @Inject(LOCATION_TOKEN) private location: Location,
  ) {
    super();
    this.syncState
      .pipe(filter((state) => state === SyncState.COMPLETED))
      .subscribe(() =>
        localStorage.setItem(
          SyncedSessionService.LAST_SYNC_KEY,
          new Date().toISOString(),
        ),
      );
    this.checkForValidSession();
  }

  /**
   * Do log in automatically if there is still a valid CouchDB cookie from last login with username and password
   */
  checkForValidSession() {
    this.authService
      .autoLogin()
      .then((user) => this.handleSuccessfulLogin(user))
      .catch(() => undefined);
  }

  async handleSuccessfulLogin(userObject: AuthUser) {
    this.startSyncAfterRemoteLogin();
    await this.localSession.handleSuccessfulLogin(userObject);
    // The app is ready to be used once the local session is logged in
    this.loginState.next(LoginState.LOGGED_IN);
    await this.remoteSession.handleSuccessfulLogin(userObject);
    this.updateLocalUser();
  }

  /**
   * Perform a login. The result will only be the login at the local DB, as we might be offline.
   * Calling this function will trigger a login in the background.
   * - If it is successful, a sync is performed in the background
   * - If it fails due to wrong credentials, yet the local login was successful somehow, we fail local login after the fact
   *
   * If the localSession is empty, the local login waits for the result of the sync triggered by the remote login (see local-session.ts).
   * If the remote login fails for some reason, this sync will never be performed, which is why it must be failed manually here
   * to abort the local login and prevent a deadlock.
   * @param username Username
   * @param password Password
   * @returns promise resolving with the local LoginState
   */
  public async login() {
    this.remoteSession.login();
  }

  private startSyncAfterRemoteLogin() {
    this.remoteSession.loginState
      .pipe(waitForChangeTo(LoginState.LOGGED_IN))
      .subscribe(() => this.startSync());
  }

  private updateLocalUser() {
    // Update local user object
    const remoteUser = this.remoteSession.getCurrentUser();
    if (remoteUser) {
      this.localSession.saveUser(remoteUser);
    }
  }

  private startSync(): Promise<any> {
    // Call live syn even when initial sync fails
    return this.sync()
      .catch((err) => this.loggingService.error(`Sync failed: ${err}`))
      .finally(() => this.liveSyncDeferred());
  }

  public getCurrentUser(): AuthUser {
    return this.localSession.getCurrentUser();
  }

  public checkPassword(username: string, password: string): boolean {
    // This only checks the password against locally saved users
    return this.localSession.checkPassword(username, password);
  }

  /** see {@link SessionService} */
  public async sync(): Promise<any> {
    this.syncState.next(SyncState.STARTED);
    try {
      const localPouchDB = this.localSession.getDatabase().getPouchDB();
      const remotePouchDB = this.remoteSession.getDatabase().getPouchDB();
      const result = await localPouchDB.sync(remotePouchDB, {
        batch_size: this.POUCHDB_SYNC_BATCH_SIZE,
      });
      this.syncState.next(SyncState.COMPLETED);
      return result;
    } catch (error) {
      this.syncState.next(SyncState.FAILED);
      throw error; // rethrow, so later Promise-handling lands in .catch, too
    }
  }

  /**
   * Start live sync in background.
   */
  public liveSync() {
    this.cancelLiveSync(); // cancel any liveSync that may have been alive before
    this.syncState.next(SyncState.STARTED);
    const localPouchDB = this.localSession.getDatabase().getPouchDB();
    const remotePouchDB = this.remoteSession.getDatabase().getPouchDB();
    this._liveSyncHandle = localPouchDB.sync(remotePouchDB, {
      live: true,
      retry: true,
    });
    this._liveSyncHandle
      .on("paused", (info) => {
        // replication was paused: either because sync is finished or because of a failed sync (mostly due to lost connection). info is empty.
        if (this.remoteSession.loginState.value === LoginState.LOGGED_IN) {
          this.syncState.next(SyncState.COMPLETED);
          // We might end up here after a failed sync that is not due to offline errors.
          // It shouldn't happen too often, as we have an initial non-live sync to catch those situations, but we can't find that out here
        }
      })
      .on("active", (info) => {
        // replication was resumed: either because new things to sync or because connection is available again. info contains the direction
        this.syncState.next(SyncState.STARTED);
      })
      .on("error", this.handleFailedSync())
      .on("complete", (info) => {
        this.loggingService.info(
          `Live sync completed: ${JSON.stringify(info)}`,
        );
        this.syncState.next(SyncState.COMPLETED);
      });
  }

  private handleFailedSync() {
    return (info) => {
      if (this.isLoggedIn()) {
        this.syncState.next(SyncState.FAILED);
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
   * Cancels a pending login retry scheduled to start in the future.
   */
  public cancelLoginOfflineRetry() {
    if (this._offlineRetryLoginScheduleHandle) {
      clearTimeout(this._offlineRetryLoginScheduleHandle);
    }
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
    this.syncState.next(SyncState.UNSYNCED);
  }

  /**
   * Get the local database instance that should be used for regular data access.
   * als see {@link SessionService}
   */
  public getDatabase(): Database {
    return this.localSession.getDatabase();
  }

  /**
   * Logout and stop any existing sync.
   * also see {@link SessionService}
   */
  public async logout() {
    this.cancelLoginOfflineRetry();
    this.localSession.logout();
    await this.remoteSession.logout();
    this.cancelLiveSync();
    this.location.reload();
    this.loginState.next(LoginState.LOGGED_OUT);
  }
}
