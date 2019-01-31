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

import PouchDB from 'pouchdb-browser';
import PouchDBAuthentication from 'pouchdb-authentication';

import { AppConfig } from '../app-config/app-config';
import { Injectable } from '@angular/core';
import { StateHandler } from './util/state-handler';
import { ConnectionState } from './connection-state.enum';

PouchDB.plugin(PouchDBAuthentication);

@Injectable()
export class RemoteSessionService {
  public database: any;

  public connectionState: StateHandler<ConnectionState> = new StateHandler<ConnectionState>(ConnectionState.disconnected);

  constructor() {
    this.database = new PouchDB(AppConfig.settings.database.remote_url + AppConfig.settings.database.name,
      {
        ajax: {
          rejectUnauthorized: false, timeout: AppConfig.settings.database.timeout,
        },
        // This is a workaround for PouchDB 7.0.0 with pouchdb-authentication 1.1.3:
        // https://github.com/pouchdb-community/pouchdb-authentication/issues/239
        // It is necessary, until this merged PR will be published in PouchDB 7.0.1
        // https://github.com/pouchdb/pouchdb/pull/7395
        fetch(url, opts) {
          opts.credentials = 'include';
          return (PouchDB as any).fetch(url, opts);
        },
        skip_setup: true
      } as PouchDB.Configuration.RemoteDatabaseConfiguration
    );
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
    this.connectionState.setState(ConnectionState.disconnected);
  }

  // TODO: Methods to retry connection if offline
}
