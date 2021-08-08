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
import { LoginState } from "../session-states/login-state.enum";
import { StateHandler } from "../session-states/state-handler";
import {
  checkPassword,
  DatabaseUser,
  encryptPassword,
  LocalUser,
} from "./local-user";
import { Database } from "../../database/database";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { User } from "../../user/user";
import { SessionService } from "./session.service";
import { ConnectionState } from "../session-states/connection-state.enum";
import { SyncState } from "../session-states/sync-state.enum";

/**
 * Responsibilities:
 * - Manage local authentication
 * - Save users in local storage
 */
@Injectable()
export class LocalSession implements SessionService {
  /** StateHandler for login state changes */
  public loginState = new StateHandler(LoginState.LOGGED_OUT);

  private currentDBUser: DatabaseUser;
  /**
   * @deprecated instead use currentUser
   */
  private currentUserEntity: User;

  constructor(
    private database?: Database,
    private entitySchemaService?: EntitySchemaService
  ) {}

  /**
   * Get a login at the local session by fetching the user from the local storage and validating the password.
   * Returns a Promise resolving with the loginState.
   * @param username Username
   * @param password Password
   */
  public async login(username: string, password: string): Promise<LoginState> {
    const user: LocalUser = JSON.parse(window.localStorage.getItem(username));
    if (user && checkPassword(password, user.encryptedPassword)) {
      this.currentDBUser = user;
      this.currentUserEntity = await this.loadUser(username);
      this.loginState.setState(LoginState.LOGGED_IN);
    } else {
      this.loginState.setState(LoginState.LOGIN_FAILED);
    }
    return this.loginState.getState();
  }

  /**
   * Saves a user to the local storage
   * @param user a object holding the username and the roles of the user
   * @param password of the user
   */
  public saveUser(user: DatabaseUser, password: string) {
    const localUser: LocalUser = {
      name: user.name,
      roles: user.roles,
      encryptedPassword: encryptPassword(password),
    };
    window.localStorage.setItem(localUser.name, JSON.stringify(localUser));
    // Update when already logged in
    if (this.getCurrentDBUser()?.name === localUser.name) {
      this.currentDBUser = localUser;
    }
  }

  /**
   * Removes the user from the local storage.
   * Method never fails, even if the user was not stored before
   * @param username
   */
  public removeUser(username: string) {
    window.localStorage.removeItem(username);
  }

  /**
   * Returns the current user Entity
   * @deprecated instead use getCurrentDBUser
   */
  public getCurrentUser(): User {
    return this.currentUserEntity;
  }

  /**
   * Returns the user format according to the CouchDB format
   */
  public getCurrentDBUser(): DatabaseUser {
    return this.currentDBUser;
  }

  /**
   * Changes the login state and removes the current user
   */
  public logout() {
    this.currentDBUser = undefined;
    this.loginState.setState(LoginState.LOGGED_OUT);
  }

  /**
   * TODO remove once admin information is migrated to new format (CouchDB)
   * Helper to get a User Entity from the Database without needing the EntityMapperService
   * @param userId Id of the User to be loaded
   */
  public async loadUser(userId: string): Promise<User> {
    if (this.database && this.entitySchemaService) {
      const user = new User("");
      const userData = await this.database.get("User:" + userId);
      this.entitySchemaService.loadDataIntoEntity(user, userData);
      return user;
    }
  }

  getConnectionState(): StateHandler<ConnectionState> {
    return new StateHandler(ConnectionState.DISCONNECTED);
  }

  getDatabase(): Database {
    return this.database;
  }

  getLoginState(): StateHandler<LoginState> {
    return this.loginState;
  }

  getSyncState(): StateHandler<SyncState> {
    return new StateHandler(SyncState.UNSYNCED);
  }

  isLoggedIn(): boolean {
    return this.loginState.getState() === LoginState.LOGGED_IN;
  }

  sync(): Promise<any> {
    return Promise.reject(new Error("Cannot sync local session"));
  }
}
