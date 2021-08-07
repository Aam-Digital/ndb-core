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
import {
  checkPassword,
  DatabaseUser,
  encryptPassword,
  LocalUser,
} from "./local-user";
import { Database } from "../../../database/database";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { User } from "../../../user/user";

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

  private currentUser: DatabaseUser;
  /**
   * @deprecated instead use currentUser
   */
  private currentUserEntity: User;

  /**
   * Create a LocalSession and set up the local PouchDB instance based on AppConfig settings.
   */
  constructor(
    private database?: Database,
    private entitySchemaService?: EntitySchemaService
  ) {}

  /**
   * Get a login at the local session by fetching the user from the local database and validating the password.
   * Returns a Promise resolving with the loginState.
   * Attention: This method waits for the first synchronisation of the database (or a fail of said initial sync).
   * @param username Username
   * @param password Password
   */
  public async login(username: string, password: string): Promise<LoginState> {
    const user: LocalUser = JSON.parse(window.localStorage.getItem(username));
    if (user) {
      if (checkPassword(password, user.encryptedPassword)) {
        this.currentUser = user;
        this.currentUserEntity = await this.loadUser(username);
        this.loginState.setState(LoginState.LOGGED_IN);
      } else {
        this.loginState.setState(LoginState.LOGIN_FAILED);
      }
    } else {
      this.loginState.setState(LoginState.LOGIN_FAILED);
    }
    return this.loginState.getState();
  }

  public saveUser(user: DatabaseUser, password: string) {
    const localUser: LocalUser = {
      name: user.name,
      roles: user.roles,
      encryptedPassword: encryptPassword(password),
    };
    window.localStorage.setItem(localUser.name, JSON.stringify(localUser));
    // Update when already logged in
    if (this.getCurrentUser()?.name === localUser.name) {
      this.currentUser = localUser;
    }
  }

  public removeUser(username: string) {
    window.localStorage.removeItem(username);
  }

  public getCurrentUser(): DatabaseUser {
    return this.currentUser;
  }

  /**
   * @deprecated instead use getCurrentUser
   */
  public getCurrentUserEntity(): User {
    return this.currentUserEntity;
  }

  public logout() {
    this.currentUser = undefined;
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
}
