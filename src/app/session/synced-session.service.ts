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
        return await this.sync();
      }

      // remote rejected but local logged in
      if (connectionState === ConnectionState.rejected) {
        if (await localLogin === LoginState.loggedIn) {
          // Someone changed the password remotely --> fail the login
          this._localSession.loginState.setState(LoginState.loginFailed);
          // TODO: We might want to alert the alertService
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

  public sync(): Promise<any> {
    return this._localSession.sync(this._remoteSession.database);
  }

  // TODO: Live-Sync that will tell us when we are offline

  public getDatabase(): Database {
    return new PouchDatabase(this._localSession.database, this._alertService);
  }

  public logout() {
    // TODO: should this throw if we are not logged in?
    this._localSession.logout();
    this._remoteSession.logout();
  }
}
