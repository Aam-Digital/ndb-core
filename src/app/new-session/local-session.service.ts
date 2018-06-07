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
 *   - started
 *   - completed
 *   - failed
 *   - unsynced
 * - Login
 *   - (wait for first sync)
 *   - logged in
 *   - not logged in
 *   - failed login (can only be wrong pwd)
 */


import PouchDB from 'pouchdb';

import { Injectable } from '@angular/core';

import { AppConfig } from '../app-config/app-config';
import { EntityMapperService } from '../entity/entity-mapper.service';
import { User } from '../user/user';

import { SyncState } from './sync-state.enum';
import { LoginState } from './login-state.enum';
import { StateHandler, StateChangedEvent } from './state-handler';

@Injectable()
export class LocalSessionService {
  public database: any;

  public loginState: StateHandler<LoginState>; // logged in, logged out, login failed
  public syncState: StateHandler<SyncState>; // assumed in sync, known out of sync, initial (not synced at all)

  constructor(private _entityMapper: EntityMapperService) {
    this.database = new PouchDB(AppConfig.settings.database.name);

    this.loginState = new StateHandler<LoginState>(LoginState.loggedOut);
    this.syncState = new StateHandler<SyncState>(SyncState.unsynced);
  }

  // TODO: the entityMapper uses the DatabaseService, where it should try to get the DB from here
  public login(username: string, password: string): Promise<LoginState> {
    return this.waitForFirstSync().then(
      () => this._entityMapper.load<User>(User, username)
    ).then(userEntity => {
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

  public sync(remoteDB): Promise<any> {
    this.syncState.setState(SyncState.started);
    return this.database.sync(remoteDB).then(() => {
      this.syncState.setState(SyncState.completed);
    }).catch(() => {
      this.syncState.setState(SyncState.failed);
      throw null; // rethrow, so later stuff lands in .catch, too
    });
  }

  public waitForFirstSync(): Promise<void> {
    return this.isInitial().then(() => {
      const subscription = this.syncState.getStateChangedStream().subscribe(change => {
        subscription.unsubscribe(); // only once
        if (change.toState === SyncState.completed) {
          return; // resolve the promise
        } else if (change.toState === SyncState.failed) {
          throw null; // reject the promise
        }
      })
    });
  }

  public isInitial(): Promise<Boolean> {
    // doc_count === 0 => initial is a valid assumptions, as documents for users must always be present, even after db-clean
    return this.database.info().then(result => result.doc_count === 0);
  }
}
