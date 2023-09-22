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

import { AuthUser } from "../auth/auth-user";
import { SyncService } from "../../database/sync.service";
import { LoginStateSubject, SessionType } from "../session-type";
import { LoginState } from "../session-states/login-state.enum";
import { Router } from "@angular/router";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { LocalAuthService } from "../auth/local/local-auth.service";
import { UserSubject } from "../../user/user";
import { AppSettings } from "../../app-settings";
import { PouchDatabase } from "../../database/pouch-database";
import { environment } from "../../../../environments/environment";
import { Database } from "../../database/database";

/**
 * A synced session creates and manages a LocalSession and a RemoteSession
 * and handles the setup of synchronisation.
 *
 * also see
 * [Session Handling, Authentication & Synchronisation]{@link /additional-documentation/concepts/session-and-authentication-system.html}
 */
@Injectable()
export class SessionManagerService {
  static readonly DEPRECATED_DB_KEY = "RESERVED_FOR";
  private pouchDatabase: PouchDatabase;
  private remoteLoggedIn = false;
  constructor(
    private remoteAuthService: KeycloakAuthService,
    private localAuthService: LocalAuthService,
    private syncService: SyncService,
    private userSubject: UserSubject,
    private loginStateSubject: LoginStateSubject,
    private router: Router,
    private database: Database,
  ) {
    if (database instanceof PouchDatabase) {
      this.pouchDatabase = database;
    }
  }

  async offlineLogin(user: AuthUser) {
    await this.initializeDatabaseForCurrentUser(user);
    this.userSubject.next(user);
    this.loginStateSubject.next(LoginState.LOGGED_IN);
  }

  getOfflineUsers(): AuthUser[] {
    return this.localAuthService.getStoredUsers();
  }

  logout() {
    if (this.remoteLoggedIn) {
      this.remoteAuthService.logout();
    } else {
      this.userSubject.next(undefined);
      this.loginStateSubject.next(LoginState.LOGGED_OUT);
      this.router.navigate(["/login"], {
        queryParams: { redirect_uri: this.router.routerState.snapshot.url },
      });
    }
  }

  /**
   * Do log in automatically if there is still a valid CouchDB cookie from last login with username and password
   */
  checkForValidSession() {
    this.loginStateSubject.next(LoginState.IN_PROGRESS);
    return this.remoteAuthService
      .autoLogin()
      .then((user) => this.handleRemoteLogin(user))
      .catch((err) => {
        this.loginStateSubject.next(LoginState.LOGIN_FAILED);
        throw err;
      });
  }

  private async handleRemoteLogin(user: AuthUser) {
    this.remoteLoggedIn = true;
    this.userSubject.next(user);
    await this.initializeDatabaseForCurrentUser(user);
    this.syncService.startSync();
    this.loginStateSubject.next(LoginState.LOGGED_IN);
    this.localAuthService.saveUser(user);
  }

  private async initializeDatabaseForCurrentUser(user: AuthUser) {
    const userDBName = `${user.name}-${AppSettings.DB_NAME}`;
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
      SessionManagerService.DEPRECATED_DB_KEY,
    );
    const dbAvailable = !dbFallback || dbFallback === user.name;
    if (dbAvailable && !(await tmpDB.isEmpty())) {
      // Old database is available and can be used by the current user
      window.localStorage.setItem(
        SessionManagerService.DEPRECATED_DB_KEY,
        user.name,
      );
      this.initDatabase(AppSettings.DB_NAME);
      return;
    }

    // Create a new database for the current user
    this.initDatabase(userDBName);
  }

  private initDatabase(dbName: string, db = this.pouchDatabase) {
    if (environment.session_type === SessionType.mock) {
      db.initInMemoryDB(dbName);
    } else {
      db.initIndexedDB(dbName);
    }
  }
}
