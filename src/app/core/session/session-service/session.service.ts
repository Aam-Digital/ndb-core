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

import { LoginState } from "../session-states/login-state.enum";
import { Database } from "../../database/database";
import { SyncState } from "../session-states/sync-state.enum";
import { StateHandler } from "../session-states/state-handler";
import { DatabaseUser } from "./local-user";

/**
 * A session manages user authentication and database connection for the app.
 *
 * To get the current user object in any other class, inject the SessionService.
 *
 * The SessionService also sets up and provides the Database.
 * To access the database in other classes
 * you should rather inject the `Database` or the `EntityMapperService` directly and not the SessionService, however.
 *
 * This SessionService is the abstract base class for the concrete implementations like SyncedSessionService.
 * You should still use `SessionService` as the dependency injection key to get access to the functionality.
 * Providers are set up in a way that you will get the correct implementation during runtime.
 */
export abstract class SessionService {
  /** StateHandler for login state changes */
  private loginState = new StateHandler(LoginState.LOGGED_OUT);
  /** StateHandler for sync state changes */
  private syncState = new StateHandler(SyncState.UNSYNCED);

  /**
   * Authenticate a user.
   * @param username
   * @param password
   */
  abstract login(username: string, password: string): Promise<LoginState>;

  /**
   * Logout the current user.
   */
  abstract logout();

  /**
   * Get the current user according to the new format
   */
  abstract getCurrentDBUser(): DatabaseUser;

  /**
   * Check a password if its valid
   * @param username the username for which the password should be checked
   * @param password the password to be checked
   * @returns boolean true if the password is correct, false otherwise
   */
  abstract checkPassword(username: string, password: string): boolean;

  /**
   * Get the session status - whether a user is authenticated currently.
   */
  public isLoggedIn(): boolean {
    return this.getLoginState().getState() === LoginState.LOGGED_IN;
  }

  /**
   * Get the state of the session.
   */
  public getLoginState(): StateHandler<LoginState> {
    return this.loginState;
  }

  /**
   * Get the state of the synchronization with the remote server.
   */
  public getSyncState(): StateHandler<SyncState> {
    return this.syncState;
  }

  /**
   * Start a synchronization process.
   */
  abstract sync(): Promise<any>;

  /**
   * Get the database for the current session.
   */
  abstract getDatabase(): Database;
}
