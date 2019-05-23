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
    this._remoteSession.login(username, password).then(async (connectionState: ConnectionState) => {
      // remote connected -- sync!
      if (connectionState === ConnectionState.connected) {
        // TODO(lh): what do we do, if we learn that the localSession login failed? We need to retry after the login.
        // TODO(lh): liveSync() here?
        return await this.sync();
      }

      // remote rejected but local logged in
      if (connectionState === ConnectionState.rejected) {
        if (await localLogin === LoginState.loggedIn) {
          // Someone changed the password remotely --> fail the login
          this._localSession.loginState.setState(LoginState.loginFailed);
          // TODO(lh): We might want to alert the alertService
        }
      }

      // If we are not connected, we must check, whether the local database is initial
      if (await this._localSession.isInitial()) {
        // Fail the sync in the local session, which will fail the authentication there
        this._localSession.syncState.setState(SyncState.failed);
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
    };
  }

  public liveSync() {
    this._localSession.syncState.setState(SyncState.started);
    this._liveSyncHandle = this._localSession.database.sync(this._remoteSession.database, {
      live: true,
      retry: true
    }).on('change', change => {
      // yo, something changed!
      // TODO(lh): Question is: before or after sync?
    }).on('paused', info => {
      // replication was paused, usually because of a lost connection
      this._remoteSession.connectionState.setState(ConnectionState.offline);
    }).on('active', info => {
      // replication was resumed
      this._remoteSession.connectionState.setState(ConnectionState.connected);
    }).on('error', err => {
      // totally unhandled error (shouldn't happen)
      this._localSession.syncState.setState(SyncState.failed)
    }).on('complete', function (info) {
      // replication was canceled!
      // TODO(lh): is this supposed to happen?
    });
    return this._liveSyncHandle;
  }

  public getDatabase(): Database {
    return new PouchDatabase(this._localSession.database, this._alertService);
  }

  public logout() {
    this._localSession.logout();
    this._remoteSession.logout();
  }
}
