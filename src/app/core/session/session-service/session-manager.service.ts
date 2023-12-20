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

import { Inject, Injectable } from "@angular/core";

import { SessionInfo } from "../auth/session-info";
import { SyncService } from "../../database/sync.service";
import { LoginStateSubject, SessionType } from "../session-type";
import { LoginState } from "../session-states/login-state.enum";
import { Router } from "@angular/router";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { LocalAuthService } from "../auth/local/local-auth.service";
import { SessionSubject, User } from "../../user/user";
import { AppSettings } from "../../app-settings";
import { PouchDatabase } from "../../database/pouch-database";
import { environment } from "../../../../environments/environment";
import { Database } from "../../database/database";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { CurrentlyLoggedInSubject } from "../currently-logged-in";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { filter } from "rxjs/operators";

/**
 * This service handles the user session.
 * This includes a online and offline login and logout.
 * After a successful login, the database for the current user is initialised.
 */
@Injectable()
export class SessionManagerService {
  readonly DEPRECATED_DB_KEY = "RESERVED_FOR";
  readonly RESET_REMOTE_SESSION_KEY = "RESET_REMOTE";
  private pouchDatabase: PouchDatabase;
  private remoteLoggedIn = false;
  constructor(
    private remoteAuthService: KeycloakAuthService,
    private localAuthService: LocalAuthService,
    private syncService: SyncService,
    private sessionInfo: SessionSubject,
    private currentlyLoggedIn: CurrentlyLoggedInSubject,
    private entityMapper: EntityMapperService,
    private loginStateSubject: LoginStateSubject,
    private router: Router,
    @Inject(NAVIGATOR_TOKEN) private navigator: Navigator,
    database: Database,
  ) {
    if (database instanceof PouchDatabase) {
      this.pouchDatabase = database;
    }
  }

  /**
   * Login for a remote session and start the sync.
   * After a user has logged in once online, this user can later also use the app offline.
   * Should only be called if there is a internet connection
   */
  async remoteLogin() {
    this.loginStateSubject.next(LoginState.IN_PROGRESS);
    if (this.remoteLoginAvailable()) {
      return this.remoteAuthService
        .login()
        .then((user) => this.handleRemoteLogin(user))
        .catch((err) => {
          this.loginStateSubject.next(LoginState.LOGIN_FAILED);
          throw err;
        });
    }
    this.loginStateSubject.next(LoginState.LOGIN_FAILED);
  }

  remoteLoginAvailable() {
    return navigator.onLine && environment.session_type === SessionType.synced;
  }

  /**
   * Login a offline session without sync.
   * @param user
   */
  offlineLogin(user: SessionInfo) {
    return this.initializeUser(user);
  }

  private async initializeUser(user: SessionInfo) {
    await this.initializeDatabaseForCurrentUser(user);
    // TODO can we remove this?
    this.sessionInfo.next(user);
    this.loginStateSubject.next(LoginState.LOGGED_IN);

    // TODO allow generic entities with fallback to User entity
    // TODO quite similar to LatestEntityLoader?
    // TODO is it a problem if the user entity is only available later or not at all?
    this.entityMapper
      .load(User, user.entityId)
      .then((res) => this.currentlyLoggedIn.next(res))
      .catch(() => undefined);
    this.entityMapper
      .receiveUpdates(User)
      .pipe(
        filter(
          ({ entity }) =>
            entity.getId(true) === user.entityId ||
            entity.getId() === user.entityId,
        ),
      )
      .subscribe(({ entity }) => this.currentlyLoggedIn.next(entity));
  }

  /**
   * Get a list of all users that can login offline
   */
  getOfflineUsers(): SessionInfo[] {
    return this.localAuthService.getStoredUsers();
  }

  /**
   * If online, clear the remote session.
   * If offline, reset the state and forward to login page.
   */
  async logout() {
    if (this.remoteLoggedIn) {
      if (this.navigator.onLine) {
        // This will forward to the keycloak logout page
        await this.remoteAuthService.logout();
      } else {
        localStorage.setItem(this.RESET_REMOTE_SESSION_KEY, "1");
      }
    }
    this.sessionInfo.next(undefined);
    this.currentlyLoggedIn.next(undefined);
    this.loginStateSubject.next(LoginState.LOGGED_OUT);
    this.remoteLoggedIn = false;
    return this.router.navigate(["/login"], {
      queryParams: { redirect_uri: this.router.routerState.snapshot.url },
    });
  }

  clearRemoteSessionIfNecessary() {
    if (localStorage.getItem(this.RESET_REMOTE_SESSION_KEY)) {
      localStorage.removeItem(this.RESET_REMOTE_SESSION_KEY);
      return this.remoteAuthService.logout();
    }
  }

  private async handleRemoteLogin(user: SessionInfo) {
    this.remoteLoggedIn = true;
    await this.initializeUser(user);
    this.syncService.startSync();
    this.localAuthService.saveUser(user);
  }

  private async initializeDatabaseForCurrentUser(user: SessionInfo) {
    const userDBName = `${user.entityId}-${AppSettings.DB_NAME}`;
    // Work on a temporary database before initializing the real one
    const tmpDB = new PouchDatabase(undefined);
    this.initDatabase(userDBName, tmpDB);
    if (!(await tmpDB.isEmpty())) {
      // Current user has own database, we are done here
      this.initDatabase(userDBName);
      return;
    }

    this.initDatabase(AppSettings.DB_NAME, tmpDB);
    const dbFallback = window.localStorage.getItem(this.DEPRECATED_DB_KEY);
    const dbAvailable = !dbFallback || dbFallback === user.entityId;
    if (dbAvailable && !(await tmpDB.isEmpty())) {
      // Old database is available and can be used by the current user
      window.localStorage.setItem(this.DEPRECATED_DB_KEY, user.entityId);
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
