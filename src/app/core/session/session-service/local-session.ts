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
import {
  DatabaseUser,
  encryptPassword,
  LocalUser,
  passwordEqualsEncrypted,
} from "./local-user";
import { Database } from "../../database/database";
import { SessionService } from "./session.service";

/**
 * Responsibilities:
 * - Manage local authentication
 * - Save users in local storage
 */
@Injectable()
export class LocalSession extends SessionService {
  private currentDBUser: DatabaseUser;

  constructor(private database: Database) {
    super();
  }

  /**
   * Get a login at the local session by fetching the user from the local storage and validating the password.
   * Returns a Promise resolving with the loginState.
   * @param username Username
   * @param password Password
   */
  public async login(username: string, password: string): Promise<LoginState> {
    const user: LocalUser = JSON.parse(window.localStorage.getItem(username));
    if (user) {
      if (passwordEqualsEncrypted(password, user.encryptedPassword)) {
        this.currentDBUser = user;
        this.getLoginState().setState(LoginState.LOGGED_IN);
      } else {
        this.getLoginState().setState(LoginState.LOGIN_FAILED);
      }
    } else {
      this.getLoginState().setState(LoginState.UNAVAILABLE);
    }
    return this.getLoginState().getState();
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

  public checkPassword(username: string, password: string): boolean {
    const user: LocalUser = JSON.parse(window.localStorage.getItem(username));
    return user && passwordEqualsEncrypted(password, user.encryptedPassword);
  }

  public getCurrentDBUser(): DatabaseUser {
    return this.currentDBUser;
  }

  /**
   * Resets the login state and current user (leaving it in local storage to allow later local login)
   */
  public logout() {
    this.currentDBUser = undefined;
    this.getLoginState().setState(LoginState.LOGGED_OUT);
  }

  getDatabase(): Database {
    return this.database;
  }

  sync(): Promise<any> {
    return Promise.reject(new Error("Cannot sync local session"));
  }
}
