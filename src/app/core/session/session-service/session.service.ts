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
import { ConnectionState } from "../session-states/connection-state.enum";
import { SyncState } from "../session-states/sync-state.enum";
import { User } from "../../user/user";
import { BehaviorSubject } from "rxjs";

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
   * Get the currently logged in user (or undefined).
   */
  abstract getCurrentUser(): User;

  /**
   * Get the session status - whether a user is authenticated currently.
   */
  abstract isLoggedIn(): boolean;

  abstract get loginStateStream(): BehaviorSubject<LoginState>;
  /**
   * Get the state of the session.
   */
  get loginState(): LoginState {
    return this.loginStateStream.value;
  }

  abstract get connectionStateStream(): BehaviorSubject<ConnectionState>;
  /**
   * Get the state of the connection to the remote server.
   */
  get connectionState(): ConnectionState {
    return this.connectionStateStream.value;
  }

  abstract get syncStateStream(): BehaviorSubject<SyncState>;
  /**
   * Get the state of the synchronization with the remote server.
   */
  get syncState(): SyncState {
    return this.syncStateStream.value;
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
