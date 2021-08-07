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
import { Injectable } from "@angular/core";
import { SyncState } from "../../session-states/sync-state.enum";
import { LoginState } from "../../session-states/login-state.enum";
import { StateHandler } from "../../session-states/state-handler";
import { checkPassword, LocalUser } from "./local-user";

/**
 * Responsibilities:
 * - Hold the local DB
 * - Hold local user
 * - Check credentials against DB
 * - Provide the state of the synchronisation of the local db
 *   - we want to block before the first full sync
 * - Provide an interface to access the data
 */
@Injectable()
export class LocalSession {
  /** StateHandler for login state changes */
  public loginState = new StateHandler(LoginState.LOGGED_OUT);
  /** StateHandler for sync state changes */
  public syncState = new StateHandler(SyncState.UNSYNCED);

  /**
   * Create a LocalSession and set up the local PouchDB instance based on AppConfig settings.
   */
  constructor() {}

  /**
   * Get a login at the local session by fetching the user from the local database and validating the password.
   * Returns a Promise resolving with the loginState.
   * Attention: This method waits for the first synchronisation of the database (or a fail of said initial sync).
   * @param username Username
   * @param password Password
   */
  public login(username: string, password: string): LoginState {
    const user: LocalUser = JSON.parse(window.localStorage.getItem(username));
    if (user) {
      if (checkPassword(password, user.encryptedPassword)) {
        this.loginState.setState(LoginState.LOGGED_IN);
      } else {
        this.loginState.setState(LoginState.LOGIN_FAILED);
      }
    } else {
      this.loginState.setState(LoginState.LOGIN_FAILED);
    }
    return this.loginState.getState();
  }

  saveUser(user: LocalUser) {
    window.localStorage.setItem(user.name, JSON.stringify(user));
  }

  public logout() {
    this.loginState.setState(LoginState.LOGGED_OUT);
  }
}
