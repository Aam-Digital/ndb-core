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
 * Responsibilities:
 * - Hold the local DB
 * - Hold local credentials
 * - Check credentials against DB
 * - Provide interface for Sync
 *   - we want to block before the first full sync
 * - Provide an interface to access the data
 */

import PouchDB from 'pouchdb-browser';

import { Injectable } from '@angular/core';

import { AppConfig } from '../app-config/app-config';
import { User } from '../user/user';

import { SyncState } from './sync-state.enum';
import { LoginState } from './login-state.enum';
import { StateHandler } from './util/state-handler';

@Injectable()
export class LocalSession {
  public database: any;
  public liveSyncHandle: any;

  public loginState: StateHandler<LoginState>; // logged in, logged out, login failed
  public syncState: StateHandler<SyncState>; // started, completed, failed, unsynced
  public currentUser: User;

  constructor() {
    this.database = new PouchDB(AppConfig.settings.database.name);

    this.loginState = new StateHandler<LoginState>(LoginState.loggedOut);
    this.syncState = new StateHandler<SyncState>(SyncState.unsynced);
  }

  /**
   * Get a login at the local session by fetching the user from the local database and validating the password.
   * Returns a Promise resolving with the loginState.
   * Attention: This method waits for the first synchronisation of the database (or a fail of said initial sync).
   * @param username Username
   * @param password Password
   */
  public async login(username: string, password: string): Promise<LoginState> {
    try {
      await this.waitForFirstSync();
      const userEntity = await this.loadUser(username);
      if (userEntity.checkPassword(password)) {
        this.loginState.setState(LoginState.loggedIn);
        this.currentUser = userEntity;
        return LoginState.loggedIn;
      } else {
        this.loginState.setState(LoginState.loginFailed);
        return LoginState.loginFailed;
      }
    } catch (error) {
      // possible error: initial sync failed
      if (error && error.toState && error.toState === SyncState.failed) {
        // TODO(lh): Alert the Alert Service?
        this.loginState.setState(LoginState.loggedOut);
        return LoginState.loggedOut;
      }
      // possible error: user object not found locally, which should return loginFailed.
      if (error && error.status && error.status === 404) {
        this.loginState.setState(LoginState.loginFailed);
        return LoginState.loginFailed;
      }
      // all other cases must throw an error
      throw error;
    }
  }

  /**
   * Wait for the first sync of the database, returns a Promise.
   * Resolves directly, if the database is not initial, otherwise waits for the first change of the SyncState to completed (or failed)
   */
  public async waitForFirstSync() {
    if (await this.isInitial()) {
      return await this.syncState.waitForChangeTo(SyncState.completed, SyncState.failed);
    }
  }

  /**
   * Check whether the local database is in an initial state.
   * This check can only be performed async, so this method returns a Promise
   */
  public isInitial(): Promise<Boolean> {
    // `doc_count === 0 => initial` is a valid assumptions, as documents for users must always be present, even after db-clean
    return this.database.info().then(result => result.doc_count === 0);
  }

  /**
   * Logout
   */
  public logout() {
    this.loginState.setState(LoginState.loggedOut);
    this.currentUser = undefined;
  }

  /**
   * Helper to get a User Entity from the Database without needing the EntityMapperService
   * @param userId Id of the User to be loaded
   */
  public async loadUser(userId: string): Promise<User> {
    const user = new User('');
    const userData = await this.database.get('User:' + userId);
    user.load(userData);
    return user;
  }
}
