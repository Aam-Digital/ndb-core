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

import { SessionService } from "./session.service";
import { LoginState } from "../session-states/login-state.enum";
import { Database } from "../../database/database";
import { PouchDatabase } from "../../database/pouch-database";
import { ConnectionState } from "../session-states/connection-state.enum";
import { SyncState } from "../session-states/sync-state.enum";
import { User } from "../../user/user";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { LoggingService } from "../../logging/logging.service";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class NewLocalSessionService extends SessionService {
  public liveSyncHandle: any;

  /** StateHandler for login state changes */
  public loginStateStream = new BehaviorSubject(LoginState.LOGGED_OUT);
  /** StateHandler for sync state changes */
  public syncStateStream = new BehaviorSubject(SyncState.UNSYNCED);
  /** StateHandler for connection state changes (not relevant for LocalSession) */
  public connectionStateStream = new BehaviorSubject(
    ConnectionState.DISCONNECTED
  );

  /** The currently authenticated user entity */
  public currentUser: User;

  constructor(
    private loggingService: LoggingService,
    private entitySchemaService: EntitySchemaService,
    private database: PouchDatabase
  ) {
    super();
  }

  /** see {@link SessionService} */
  public isLoggedIn(): boolean {
    return this.loginState === LoginState.LOGGED_IN;
  }

  /**
   * Get a login at the local session by fetching the user from the local database and validating the password.
   * Returns a Promise resolving with the loginState.
   * Attention: This method waits for the first synchronisation of the database (or a fail of said initial sync).
   * @param username Username
   * @param password Password
   */
  public async login(username: string, password: string): Promise<LoginState> {
    let userEntity: User;

    try {
      userEntity = await this.loadUser(username);
    } catch (error) {
      if (error?.status === 404) {
        return this.failLogin();
      } else {
        throw error;
      }
    }

    if (!userEntity.checkPassword(password)) {
      return this.failLogin();
    }

    return this.succeedLogin(userEntity, password);
  }

  /**
   * Update all states when login failed
   * @private
   */
  private failLogin(): LoginState {
    this.loginStateStream.next(LoginState.LOGIN_FAILED);
    return LoginState.LOGIN_FAILED;
  }

  /**
   * Update all states when login succeeded
   * @param loggedInUser
   * @param password
   * @private
   */
  private succeedLogin(loggedInUser: User, password: string): LoginState {
    this.currentUser = loggedInUser;
    this.currentUser.decryptCloudPassword(password);
    this.loginStateStream.next(LoginState.LOGGED_IN);
    this.connectionStateStream.next(ConnectionState.OFFLINE);
    return LoginState.LOGGED_IN;
  }

  /**
   * Helper to get a User Entity from the Database without needing the EntityMapperService
   * @param userId Id of the User to be loaded
   */
  private async loadUser(userId: string): Promise<User> {
    const user = new User("");
    const userData = await this.database.get("User:" + userId);
    this.entitySchemaService.loadDataIntoEntity(user, userData);
    return user;
  }

  /** see {@link SessionService} */
  public getCurrentUser(): User {
    return this.currentUser;
  }

  /** see {@link SessionService} */
  public async sync(remoteDatabase?): Promise<any> {
    this.syncStateStream.next(SyncState.STARTED);
    try {
      const result = await this.database.sync(remoteDatabase);
      this.syncStateStream.next(SyncState.COMPLETED);
      return result;
    } catch (error) {
      this.syncStateStream.next(SyncState.FAILED);
      throw error;
    }
  }

  /**
   * Get the local database instance that should be used for regular data access.
   * als see {@link SessionService}
   */
  public getDatabase(): Database {
    return this.database;
  }

  /**
   * Logout and stop any existing sync.
   * also see {@link SessionService}
   */
  public logout() {
    this.currentUser = undefined;
    this.loginStateStream.next(LoginState.LOGGED_OUT);
    this.connectionStateStream.next(ConnectionState.DISCONNECTED);
  }
}
