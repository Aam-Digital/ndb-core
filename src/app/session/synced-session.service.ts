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

import { Injectable } from '@angular/core';
import { AlertService } from '../alerts/alert.service';

import { SessionService } from './session.service';
import { LocalSession } from './local-session';
import { RemoteSession } from './remote-session';
import { LoginState } from './login-state.enum';
import { Database } from '../database/database';
import { PouchDatabase } from '../database/pouch-database';
import { ConnectionState } from './connection-state.enum';
import { SyncState } from './sync-state.enum';
import { User } from '../user/user';

@Injectable()
export class SyncedSessionService extends SessionService {
  private _localSession: LocalSession;
  private _remoteSession: RemoteSession;
  private _liveSyncHandle: any;
  private _liveSyncScheduledHandle: any;

  constructor(private _alertService: AlertService) {
    super();
    this._localSession = new LocalSession();
    this._remoteSession = new RemoteSession();
  }

  public isLoggedIn(): boolean {
    return this._localSession.loginState.getState() === LoginState.loggedIn;
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
    const localLogin =  this._localSession.login(username, password);
    const remoteLogin = this._remoteSession.login(username, password);
    remoteLogin.then(async (connectionState: ConnectionState) => {
      // remote connected -- sync!
      if (connectionState === ConnectionState.connected) {
        const syncPromise = this.sync(); // no liveSync() here, as we can't know when that's finished if there are no changes.

        // no matter the result of the non-live sync(), start liveSync() once it is done
        syncPromise.then(
          // successful -> start liveSync()
          () => this.liveSyncDeferred(),
          // not successful -> only start a liveSync() to retry, if we are logged in locally
          // otherwise the UI is in a fairly unusable state.
          async () => {
            if (await localLogin === LoginState.loggedIn) {
              this.liveSyncDeferred();
            }
          }
        );

        // asynchronously check if the local login failed --> this happens, when the password was changed at the remote
        localLogin.then(async (loginState: LoginState) => {
          if (loginState === LoginState.loginFailed) {
            // in this case: when the sync is completed, retry the local login after the sync
            await syncPromise;
            return this._localSession.login(username, password);
          }
        });

        return syncPromise;
      }

      // If we are not connected, we must check (asynchronously), whether the local database is initial
      this._localSession.isInitial().then(isInitial => {
        if (isInitial) {
          // Fail the sync in the local session, which will fail the authentication there
          this._localSession.syncState.setState(SyncState.failed);
        }
      });

      // remote rejected but local logged in
      if (connectionState === ConnectionState.rejected) {
        if (await localLogin === LoginState.loggedIn) {
          // Someone changed the password remotely --> fail the login
          this._localSession.logout();
          // TODO(lh): We might want to alert the alertService
        }
      }

      // offline? retry! TODO(lh): Backoff
      if (connectionState === ConnectionState.offline) {
        setTimeout(() => {
          this.login(username, password);
        }, 2000);
      }
    });
    return localLogin; // the local login is the Promise that counts
  }

  public getCurrentUser(): User {
    return this._localSession.currentUser;
  }

  public getLoginState() {
    return this._localSession.loginState;
  }
  public getConnectionState() {
    return this._remoteSession.connectionState;
  }
  public getSyncState() {
    return this._localSession.syncState;
  }

  public async sync(): Promise<any> {
    this._localSession.syncState.setState(SyncState.started);
    try {
      const result = await this._localSession.database.sync(this._remoteSession.database);
      this._localSession.syncState.setState(SyncState.completed);
      return result;
    } catch (error) {
      this._localSession.syncState.setState(SyncState.failed);
      throw error; // rethrow, so later Promise-handling lands in .catch, too
    }
  }

  public liveSync() {
    this.cancelLiveSync(); // cancel any liveSync that may have been alive before
    this._localSession.syncState.setState(SyncState.started);
    this._liveSyncHandle = this._localSession.database.sync(this._remoteSession.database, {
      live: true,
      retry: true
    }).on('change', change => {
      // after sync. change has direction and changes with info on errors etc
    }).on('paused', info => {
      // replication was paused: either because sync is finished or because of a failed sync (mostly due to lost connection). info is empty.
      if (this.getConnectionState().getState() !== ConnectionState.offline) {
        this._localSession.syncState.setState(SyncState.completed);
        // We might end up here after a failed sync that is not due to offline errors.
        // It shouldn't happen too often, as we have an initial non-live sync to catch those situations, but we can't find that out here
      }
    }).on('active', info => {
      // replication was resumed: either because new things to sync or because connection is available again. info contains the direction
      this._localSession.syncState.setState(SyncState.started);
    }).on('error', err => {
      // totally unhandled error (shouldn't happen)
      this._localSession.syncState.setState(SyncState.failed);
    }).on('complete', info => {
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

  public getDatabase(): Database {
    return new PouchDatabase(this._localSession.database, this._alertService);
  }

  public logout() {
    this.cancelLiveSync();
    this._localSession.logout();
    this._remoteSession.logout();
  }
}
