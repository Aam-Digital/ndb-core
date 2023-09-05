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
import { LocalUser, passwordEqualsEncrypted } from "./local-user";
import { PouchDatabase } from "../../database/pouch-database";
import { AppSettings } from "../../app-settings";
import { LoginStateSubject, SessionType } from "../session-type";
import { environment } from "../../../../environments/environment";
import { AuthUser } from "./auth-user";

/**
 * Responsibilities:
 * - Manage local authentication
 * - Save users in local storage
 * - Create local PouchDB according to session type and logged in user
 */
@Injectable()
export class LocalSession {
  static readonly DEPRECATED_DB_KEY = "RESERVED_FOR";
  private currentDBUser: AuthUser;
  private static LAST_LOGGED_IN_KEY = "LAST_USER";

  constructor(
    private database: PouchDatabase,
    private loginStateSubject: LoginStateSubject,
  ) {}

  /**
   * Get a login at the local session by fetching the user from the local storage and validating the password.
   * Returns a Promise resolving with the loginState.
   */
  public async login() {
    const user = this.getStoredUser(LocalSession.LAST_LOGGED_IN_KEY);
    if (user) {
      await this.handleSuccessfulLogin(user);
    }
  }

  canLoginOffline(): boolean {
    return !!localStorage.getItem(LocalSession.LAST_LOGGED_IN_KEY);
  }

  private getStoredUser(username: string): LocalUser {
    const stored = window.localStorage.getItem(username);
    return JSON.parse(stored);
  }

  public async handleSuccessfulLogin(userObject: AuthUser) {
    this.currentDBUser = userObject;
    await this.initializeDatabaseForCurrentUser();
    this.loginStateSubject.next(LoginState.LOGGED_IN);
  }

  private async initializeDatabaseForCurrentUser() {
    const userDBName = `${this.currentDBUser.name}-${AppSettings.DB_NAME}`;
    // Work on a temporary database before initializing the real one
    const tmpDB = new PouchDatabase(undefined);
    this.initDatabase(userDBName, tmpDB);
    if (!(await tmpDB.isEmpty())) {
      // Current user has own database, we are done here
      this.initDatabase(userDBName);
      return;
    }

    this.initDatabase(AppSettings.DB_NAME, tmpDB);
    const dbFallback = window.localStorage.getItem(
      LocalSession.DEPRECATED_DB_KEY,
    );
    const dbAvailable = !dbFallback || dbFallback === this.currentDBUser.name;
    if (dbAvailable && !(await tmpDB.isEmpty())) {
      // Old database is available and can be used by the current user
      window.localStorage.setItem(
        LocalSession.DEPRECATED_DB_KEY,
        this.currentDBUser.name,
      );
      this.initDatabase(AppSettings.DB_NAME);
      return;
    }

    // Create a new database for the current user
    this.initDatabase(userDBName);
  }

  private initDatabase(dbName: string, db = this.database) {
    if (environment.session_type === SessionType.mock) {
      db.initInMemoryDB(dbName);
    } else {
      db.initIndexedDB(dbName);
    }
  }

  /**
   * Saves a user to the local storage
   * @param user a object holding the username and the roles of the user
   */
  public saveUser(user: AuthUser) {
    window.localStorage.setItem(
      LocalSession.LAST_LOGGED_IN_KEY,
      JSON.stringify(user),
    );
  }

  /**
   * Removes the user from the local storage.
   * Method never fails, even if the user was not stored before
   * @param username
   */
  public removeUser(username: string) {
    window.localStorage.removeItem(username);
    window.localStorage.removeItem(username.trim().toLowerCase());
  }

  public checkPassword(username: string, password: string): boolean {
    const user = this.getStoredUser(username);
    return user && passwordEqualsEncrypted(password, user.encryptedPassword);
  }

  public getCurrentUser(): AuthUser {
    return this.currentDBUser;
  }

  /**
   * Resets the login state and current user (leaving it in local storage to allow later local login)
   */
  public logout() {
    this.currentDBUser = undefined;
    this.loginStateSubject.next(LoginState.LOGGED_OUT);
  }

  getDatabase(): PouchDatabase {
    return this.database;
  }
}
