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

/**
 * Tasks:
 * - Hold the remote DB
 * - Hold credentials
 * - Keep local and remote state sync
 * - Handle sync
 * - Provide unified interface for accessing
 *   - data (r/w)
 *   - login state (r)
 *   - sync state (r)
 */

/**
 * States:
 * - local (known) out of sync, remote disconnected (no internet)
 * - local (assumed) in sync, remote disconnected (no internet)
 * - local (known) out of sync, remote connectable
 * - local (assumed) in sync, remote connectable
 *
 * - local authenticated, remote authenticated
 * - local authenticated, remote auth failed
 * - local auth failed, remote authenticated
 * - local auth failed, remote auth failed
 *
 * --> logged in
 * --> not logged in
 * --> getDB
 */

import { Injectable } from '@angular/core';
import { AlertService } from '../alerts/alert.service';

import { LocalSessionService } from './local-session.service';
import { RemoteSessionService } from './remote-session.service';
import { LoginState } from './login-state.enum';
import { Database } from '../database/database';
import { PouchDatabase } from '../database/pouch-database';
import { ConnectionState } from './connection-state.enum';
import { SyncState } from './sync-state.enum';

@Injectable()
export class SessionService {
  constructor(private _localSession: LocalSessionService,
              private _remoteSession: RemoteSessionService,
              private _alertService: AlertService) {
  }

  public isLoggedIn(): boolean {
    return this._localSession.loginState.getState() === LoginState.loggedIn;
  }

  public login(username: string, password: string): Promise<any> {
    const localLogin =  this._localSession.login(username, password);
    this._remoteSession.login(username, password).then((connectionState: ConnectionState) => {
      if (connectionState === ConnectionState.connected) {
        return this.sync();
      }
      this._localSession.isInitial().then(isInitial => {
        if (isInitial) {
          // Fail the sync in the local session, which will fail the authentication there
          this._localSession.syncState.setState(SyncState.failed);
        }
      });
      // TODO: If the localDB is out of sync, we might have a login, that should never have been successful
      // => terminate the local session!
    });
    return localLogin;
  }

  public sync(): Promise<any> {
    return this._localSession.sync(this._remoteSession.database);
  }

  public getDatabase(): Database {
    return new PouchDatabase(this._localSession.database);
  }
}
