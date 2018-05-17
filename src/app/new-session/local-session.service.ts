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
 * - Hold the local DB
 * - Hold local credentials
 * - Check credentials against DB
 * - Provide interface for Sync
 *   - we want to block before the first full sync
 * - Provide an interface to access the data
 */

/**
 * States
 * - Sync -> must be persisted across restarts! we must not authenticate if state was unsynced
 *   - initialized, never synced
 *   - synced
 *   - unsynced
 * - Login
 *   - (wait for first sync)
 *   - logged in
 *   - not logged in
 *   - failed login (can only be wrong pwd)
 */


import PouchDB from 'pouchdb';

import { Injectable, EventEmitter } from '@angular/core';

import { ConfigService } from '../config/config.service';
import { EntityMapperService } from '../entity/entity-mapper.service';
import { User } from '../user/user';

import { SyncState } from './sync-state.enum';
import { LoginState } from './login-state.enum';
import { StateHandler, StateChangedEvent } from './state-handler';

@Injectable()
export class LocalSessionService {
  protected database: any;

  protected loginState: StateHandler<LoginState>; // logged in, logged out, login failed
  protected syncState: StateHandler<SyncState>; // assumed in sync, known out of sync, initial (not synced at all)

  constructor(private _appConfig: ConfigService, private _entityMapper: EntityMapperService) {
    this.database = new PouchDB(this._appConfig.database.name);

    this.loginState = new StateHandler<LoginState>(LoginState.loggedOut);
    this.syncState = new StateHandler<SyncState>(SyncState[window.sessionStorage.getItem("syncState")]);    // restore sync state
    this.syncState.getStateChangedStream().subscribe(function(stateChange: StateChangedEvent<SyncState>) {  // save sync state on change
      window.sessionStorage.setItem("syncState", SyncState[stateChange.toState]);
    });
  }

  // TODO: wait for first sync (-> as entitymapper gets its data from the database, i.e. the session, we definitely need to wait)
  // TODO: the entityMapper uses the DatabaseService we might not have at this point...
  protected authenticate(username: string, password: string): Promise<LoginState> {
    return this._entityMapper.load<User>(User, username).then(userEntity => {
      if (userEntity.checkPassword(password)) {
        this.loginState.setState(LoginState.loggedIn);
        return LoginState.loggedIn;
      } else {
        this.loginState.setState(LoginState.loginFailed);
        return LoginState.loginFailed;
      }
    }).catch(error => {
      // TODO: one error should be "no entity found for this key", which should return false.
      //       all other cases should throw an error
      console.log(error);
      this.loginState.setState(LoginState.loginFailed);
      return LoginState.loginFailed;
    });
  }
}