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
 * - Hold remote credentials
 * - Handle auth
 * - Provide interface for Sync
 * - provide "am i online"-info
 */

/**
 * States:
 * - Disconnected
 *   - not tried yet
 *   - auth fail
 *   - db not accessible (offline etc)
 * - Connected
 */

import PouchDB from 'pouchdb';
import PouchDBAuthentication from 'pouchdb-authentication';

import { AppConfig } from '../app-config/app-config';
import { Injectable } from '@angular/core';
import { StateHandler } from './util/state-handler';
import { ConnectionState } from './connection-state.enum';

PouchDB.plugin(PouchDBAuthentication);

@Injectable()
export class RemoteSessionService {
  public database: any;

  public connectionState: StateHandler<ConnectionState> = new StateHandler<ConnectionState>();

  constructor() {
    this.database = new PouchDB(AppConfig.settings.database.name);
  }

  /**
   * Connect to the remote Database. Tries to determine from a possible error whether the login was rejected or the user is offline.
   * @param username Username
   * @param password Password
   */
  public login(username: string, password: string): Promise<ConnectionState> {
    const ajaxOpts = {
      ajax: {
        headers: {
          Authorization: 'Basic ' + window.btoa(username + ':' + password)
        }
      }
    };

    return this.database.login(username, password, ajaxOpts).then(() => {
      this.connectionState.setState(ConnectionState.connected);
      return ConnectionState.connected;
    }).catch((error: any) => {
      if (error.status === 401) { // TODO: This test is not the best
        this.connectionState.setState(ConnectionState.rejected);
        return ConnectionState.rejected;
      } else {
        this.connectionState.setState(ConnectionState.offline);
        return ConnectionState.offline;
      }
    });
  }

  /**
   * Logout
   */
  public logout(): void {
    this.database.logout();
  }
}
