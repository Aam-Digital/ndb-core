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

import { LocalSession } from "./local-session";
import { AuthUser } from "../auth/auth-user";
import { SyncService } from "../../database/sync.service";
import { UserService } from "../../user/user.service";
import { LoginStateSubject } from "../session-type";
import { LoginState } from "../session-states/login-state.enum";
import { Router } from "@angular/router";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { LocalAuthService } from "../auth/local/local-auth.service";

/**
 * A synced session creates and manages a LocalSession and a RemoteSession
 * and handles the setup of synchronisation.
 *
 * also see
 * [Session Handling, Authentication & Synchronisation]{@link /additional-documentation/concepts/session-and-authentication-system.html}
 */
@Injectable()
export class SessionManagerService {
  private remoteLoggedIn = false;
  constructor(
    private remoteAuthService: KeycloakAuthService,
    private localAuthService: LocalAuthService,
    private localSession: LocalSession,
    private syncService: SyncService,
    private userService: UserService,
    private loginStateSubject: LoginStateSubject,
    private router: Router,
  ) {}

  remoteLogin() {
    this.remoteAuthService.authenticate();
  }

  offlineLogin() {
    this.userService.user = this.localAuthService.login();
    this.loginStateSubject.next(LoginState.LOGGED_IN);
  }

  canLoginOffline(): boolean {
    return this.localAuthService.canLoginOffline();
  }

  logout() {
    if (this.remoteLoggedIn) {
      this.remoteAuthService.logout();
    } else {
      this.userService.user = undefined;
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
    return this.remoteAuthService
      .autoLogin()
      .then((user) => this.handleRemoteLogin(user))
      .catch(() => undefined);
  }

  async handleRemoteLogin(user: AuthUser) {
    this.remoteLoggedIn = true;
    await this.localSession.initializeDatabaseForCurrentUser(user);
    this.userService.user = user;
    this.localAuthService.saveUser(user);
    this.loginStateSubject.next(LoginState.LOGGED_IN);
    return this.syncService.startSync();
  }
}
