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
import { AlertService } from "../../alerts/alert.service";

import { SessionService } from "./session.service";
import { LocalSession } from "./local-session";
import { RemoteSession } from "./remote-session";
import { LoginState } from "../session-states/login-state.enum";
import { Database } from "../../database/database";
import { PouchDatabase } from "../../database/pouch-database";
import { ConnectionState } from "../session-states/connection-state.enum";
import { SyncState } from "../session-states/sync-state.enum";
import { User } from "../../user/user";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { LoggingService } from "../../logging/logging.service";

/**
 * A synced session creates and manages a LocalSession and a RemoteSession
 * and handles the setup of synchronisation.
 *
 * also see
 * [Session Handling, Authentication & Synchronisation]{@link /additional-documentation/concepts/session-and-authentication-system.html}
 */
@Injectable()
export class SyncedSessionService extends SessionService {
  private _localSession: LocalSession;
  private _remoteSession: RemoteSession;
  private _liveSyncHandle: any;
  private _liveSyncScheduledHandle: any;
  private _offlineRetryLoginScheduleHandle: any;

  constructor(
    private _alertService: AlertService,
    private _loggingService: LoggingService,
    private _entitySchemaService: EntitySchemaService
  ) {
    super();
    this._localSession = new LocalSession(this._entitySchemaService);
    this._remoteSession = new RemoteSession();
  }

  /** see {@link SessionService} */
  public isLoggedIn(): boolean {
    return this._localSession.loginState.getState() === LoginState.LOGGED_IN;
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
   * @returns a promise resolving with the local LoginState
   */
  public login(username: string, password: string): Promise<LoginState> {
    this.cancelLoginOfflineRetry(); // in case this is running in the background
    this.getSyncState().setState(SyncState.UNSYNCED);

    const localLogin = this._localSession.login(username, password);
    const remoteLogin = this._remoteSession.login(username, password);

    remoteLogin
      .then(async (connectionState: ConnectionState) => {
        // remote connected -- sync!
        if (connectionState === ConnectionState.CONNECTED) {
          const syncPromise = this.sync(); // no liveSync() here, as we can't know when that's finished if there are no changes.

          // no matter the result of the non-live sync(), start liveSync() once it is done
          syncPromise
            .then(
              // successful -> start liveSync()
              () => this.liveSyncDeferred(),
              // not successful -> only start a liveSync() to retry, if we are logged in locally
              // otherwise the UI is in a fairly unusable state.
              async () => {
                if ((await localLogin) === LoginState.LOGGED_IN) {
                  this.liveSyncDeferred();
                } else {
                  // TODO(lh): Alert the AlertService: Your password was changed recently, but there is an issue with sync. Try again later!
                }
              }
            )
            .catch((err) => this._loggingService.error(err));

          // asynchronously check if the local login failed --> this happens, when the password was changed at the remote
          localLogin.then(async (loginState: LoginState) => {
            if (loginState === LoginState.LOGIN_FAILED) {
              // in this case: when the sync is completed, retry the local login after the sync
              try {
                await syncPromise;
              } catch (err) {
                this._loggingService.error(err);
              }
              return this._localSession.login(username, password);
            }
          });

          return syncPromise;
        }

        // If we are not connected, we must check (asynchronously), whether the local database is initial
        this._localSession.isInitial().then((isInitial) => {
          if (isInitial) {
            // If we were initial, the local session was waiting for a sync.
            if (connectionState === ConnectionState.REJECTED) {
              // Explicitly fail the login if the Connection was rejected, so the LocalSession knows what's going on
              // additionally, fail sync to resolve deadlock
              this._localSession.loginState.setState(LoginState.LOGIN_FAILED);
              this._localSession.syncState.setState(SyncState.FAILED);
            } else {
              // Explicitly abort the sync to resolve the deadlock
              this._localSession.syncState.setState(SyncState.ABORTED);
            }
          }
        });

        // remote rejected but local logged in
        if (connectionState === ConnectionState.REJECTED) {
          if ((await localLogin) === LoginState.LOGGED_IN) {
            // Someone changed the password remotely --> log out and signal failed login
            this._localSession.logout();
            this._localSession.loginState.setState(LoginState.LOGIN_FAILED);
            this._alertService.addDanger(
              $localize`Your password was changed recently. Please retry with your new password!`
            );
          }
        }

        // offline? retry (unless we are in an initial state)! TODO(lh): Backoff
        if (
          connectionState === ConnectionState.OFFLINE &&
          !(await this._localSession.isInitial())
        ) {
          this._offlineRetryLoginScheduleHandle = setTimeout(() => {
            this.login(username, password);
          }, 2000);
        }
      })
      .catch((err) => this._loggingService.error(err));
    return localLogin; // the local login is the Promise that counts
  }

  /** see {@link SessionService} */
  public getCurrentUser(): User {
    return this._localSession.currentUser;
  }

  /** see {@link SessionService} */
  public getLoginState() {
    return this._localSession.loginState;
  }
  /** see {@link SessionService} */
  public getConnectionState() {
    return this._remoteSession.connectionState;
  }
  /** see {@link SessionService} */
  public getSyncState() {
    return this._localSession.syncState;
  }

  /** see {@link SessionService} */
  public async sync(): Promise<any> {
    this._localSession.syncState.setState(SyncState.STARTED);
    try {
      const result = await this._localSession.database.sync(
        this._remoteSession.database,
        { batch_size: 500 }
      );
      this._localSession.syncState.setState(SyncState.COMPLETED);
      return result;
    } catch (error) {
      this._localSession.syncState.setState(SyncState.FAILED);
      throw error; // rethrow, so later Promise-handling lands in .catch, too
    }
  }

  /**
   * Start live sync in background.
   */
  public liveSync() {
    this.cancelLiveSync(); // cancel any liveSync that may have been alive before
    this._localSession.syncState.setState(SyncState.STARTED);
    this._liveSyncHandle = this._localSession.database
      .sync(this._remoteSession.database, {
        live: true,
        retry: true,
      })
      .on("change", (change) => {
        // after sync. change has direction and changes with info on errors etc
      })
      .on("paused", (info) => {
        // replication was paused: either because sync is finished or because of a failed sync (mostly due to lost connection). info is empty.
        if (this.getConnectionState().getState() !== ConnectionState.OFFLINE) {
          this._localSession.syncState.setState(SyncState.COMPLETED);
          // We might end up here after a failed sync that is not due to offline errors.
          // It shouldn't happen too often, as we have an initial non-live sync to catch those situations, but we can't find that out here
        }
      })
      .on("active", (info) => {
        // replication was resumed: either because new things to sync or because connection is available again. info contains the direction
        this._localSession.syncState.setState(SyncState.STARTED);
      })
      .on("error", (err) => {
        // totally unhandled error (shouldn't happen)
        this._localSession.syncState.setState(SyncState.FAILED);
      })
      .on("complete", (info) => {
        // replication was canceled!
        this._liveSyncHandle = null;
      });
    return this._liveSyncHandle;
  }

  /**
   * Schedules liveSync to be started.
   * This method should be used to start the liveSync after the initial non-live sync,
   * so the browser makes a round trip to the UI and hides the potentially visible first-sync dialog.
   * @param timeout ms to wait before starting the liveSync
   */
  public liveSyncDeferred(timeout = 1000) {
    this.cancelLiveSync(); // cancel any liveSync that may have been alive before
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
  }

  /**
   * Get the local database instance that should be used for regular data access.
   * als see {@link SessionService}
   */
  public getDatabase(): Database {
    return new PouchDatabase(this._localSession.database, this._loggingService);
  }

  /**
   * Logout and stop any existing sync.
   * also see {@link SessionService}
   */
  public logout() {
    this.cancelLoginOfflineRetry();
    this.cancelLiveSync();
    this._localSession.logout();
    this._remoteSession.logout();
  }
}
