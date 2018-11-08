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

import { Injectable, Injector } from '@angular/core';

import { AppConfig } from '../app-config/app-config';
import { User } from '../user/user';

import { SyncState } from './sync-state.enum';
import { LoginState } from './login-state.enum';
import { StateHandler } from './util/state-handler';

@Injectable()
export class LocalSessionService {
  public database: any;

  public loginState: StateHandler<LoginState>; // logged in, logged out, login failed
  public syncState: StateHandler<SyncState>; // started, completed, failed, unsynced
  public currentUser: User;

  constructor() {
    this.database = new PouchDB(AppConfig.settings.database.name);

    this.loginState = new StateHandler<LoginState>(LoginState.loggedOut);
    this.syncState = new StateHandler<SyncState>(SyncState.unsynced);
  }

  // TODO: the entityMapper uses the DatabaseService, where it should try to get the DB from here
  /**
   * Get a login at the local session by fetching the user from the local database and validating the password.
   * Returns a Promise resolving with the loginState.
   * Attention: This method waits for the first synchronisation of the database (or a fail of said initial sync).
   * @param username Username
   * @param password Password
   */
  public login(username: string, password: string): Promise<LoginState> {
    return this.waitForFirstSync().then(() => {
      return this.loadUser(username);
    }).then(userEntity => {
      if (userEntity.checkPassword(password)) {
        this.loginState.setState(LoginState.loggedIn);
        this.currentUser = userEntity;
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

  /**
   * Syncs the local DB with any (remote) PouchDB passed to the method.
   * Updates the sessions SyncState.
   * Returns a Promise containing the result of database.sync()
   * @param remoteDB A native PouchDB-object
   */
  public sync(remoteDB): Promise<any> {
    this.syncState.setState(SyncState.started);
    return this.database.sync(remoteDB).then(res => {
      this.syncState.setState(SyncState.completed);
      return res;
    }).catch(error => {
      this.syncState.setState(SyncState.failed);
      throw error; // rethrow, so later Promise-handling lands in .catch, too
    });
  }

  /**
   * Wait for the first sync of the database, returns a Promise.
   * Resolves directly, if the database is not initial, otherwise waits for the first change of the SyncState to completed (or failed)
   */
  public waitForFirstSync(): Promise<any> {
    return this.isInitial().then(bInitial => {
      // if initial, wait for changes in the syncState
      if (bInitial) {
        return this.syncState.waitForChangeTo(SyncState.completed, SyncState.failed);
      }
      // otherwise, just do nothing to resolve directly
    });
  }

  /**
   * Check whether the local database is in an initial state.
   * This check can only be performed async, so this method returns a Promise
   */
  public isInitial(): Promise<Boolean> {
    // doc_count === 0 => initial is a valid assumptions, as documents for users must always be present, even after db-clean
    return this.database.info().then(result => result.doc_count === 0);
  }

  /**
   * Logout
   */
  public logout() {
    this.loginState.setState(LoginState.loggedOut);
  }

  public async loadUser(userId: string): Promise<User> {
    const user = new User('');
    const userData = await this.database.get('User:' + userId);
    user.load(userData);
    return user;
  }
}
