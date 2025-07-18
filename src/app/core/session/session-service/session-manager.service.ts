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

import { Injectable, inject } from "@angular/core";

import { SessionInfo, SessionSubject } from "../auth/session-info";
import { LoginStateSubject, SessionType } from "../session-type";
import { LoginState } from "../session-states/login-state.enum";
import { Router } from "@angular/router";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { LocalAuthService } from "../auth/local/local-auth.service";
import { environment } from "../../../../environments/environment";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { CurrentUserSubject } from "../current-user-subject";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { filter, take } from "rxjs/operators";
import { Subscription } from "rxjs";
import { Entity } from "../../entity/model/entity";
import { ConfigService } from "../../config/config.service";
import { DatabaseResolverService } from "../../database/database-resolver.service";

/**
 * This service handles the user session.
 * This includes an online and offline login and logout.
 * After a successful login, the database for the current user is initialised.
 */
@Injectable()
export class SessionManagerService {
  private remoteAuthService = inject(KeycloakAuthService);
  private localAuthService = inject(LocalAuthService);
  private sessionInfo = inject(SessionSubject);
  private currentUser = inject(CurrentUserSubject);
  private entityMapper = inject(EntityMapperService);
  private loginStateSubject = inject(LoginStateSubject);
  private router = inject(Router);
  private navigator = inject<Navigator>(NAVIGATOR_TOKEN);
  private configService = inject(ConfigService);
  private databaseResolver = inject(DatabaseResolverService);

  readonly RESET_REMOTE_SESSION_KEY = "RESET_REMOTE";
  private remoteLoggedIn = false;
  private updateSubscription: Subscription;

  /**
   * Login for a remote session and start the sync.
   * After a user has logged in once online, this user can later also use the app offline.
   * Should only be called if there is an internet connection
   */
  async remoteLogin() {
    this.loginStateSubject.next(LoginState.IN_PROGRESS);
    if (this.remoteLoginAvailable()) {
      return this.remoteAuthService
        .login()
        .then((user) => this.handleRemoteLogin(user))
        .catch((err) => {
          this.loginStateSubject.next(LoginState.LOGIN_FAILED);
          // ignore fall back to offline login - if there was a technical error, the AuthService has already logged/reported it
        });
    }
    this.loginStateSubject.next(LoginState.LOGIN_FAILED);
  }

  remoteLoginAvailable() {
    return navigator.onLine && environment.session_type === SessionType.synced;
  }

  /**
   * Login an offline session without sync.
   * @param user
   */
  offlineLogin(user: SessionInfo) {
    return this.initializeUser(user);
  }

  private async initializeUser(session: SessionInfo) {
    await this.databaseResolver.initDatabasesForSession(session);
    this.sessionInfo.next(session);
    this.loginStateSubject.next(LoginState.LOGGED_IN);
    this.configService.configUpdates.pipe(take(1)).subscribe(() =>
      // requires initial config to be loaded first!
      this.initUserEntity(session.entityId),
    );
  }

  private initUserEntity(entityId: string) {
    if (!entityId) {
      this.currentUser.next(null);
      return;
    }

    const entityType = Entity.extractTypeFromId(entityId);
    this.entityMapper
      .load(entityType, entityId)
      .catch(() => null) // see CurrentUserSubject: emits "null" for non-existing user entity
      .then((res) => this.currentUser.next(res));
    this.updateSubscription = this.entityMapper
      .receiveUpdates(entityType)
      .pipe(
        filter(
          ({ entity }) =>
            entity.getId() === entityId || entity.getId(true) === entityId,
        ),
      )
      .subscribe(({ entity }) => this.currentUser.next(entity));
  }

  /**
   * Get a list of all users that can log in offline
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
    // resetting app state
    this.sessionInfo.next(undefined);
    this.updateSubscription?.unsubscribe();
    this.currentUser.next(undefined);
    this.loginStateSubject.next(LoginState.LOGGED_OUT);
    this.remoteLoggedIn = false;
    await this.databaseResolver.resetDatabases();
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
    this.localAuthService.saveUser(user);
  }
}
