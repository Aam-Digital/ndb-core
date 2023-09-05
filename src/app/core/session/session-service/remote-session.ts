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
import { AuthService } from "../auth/auth.service";
import { AuthUser } from "./auth-user";
import { LoginStateSubject } from "../session-type";

/**
 * Responsibilities:
 * - Hold the remote DB
 * - Handle auth against CouchDB
 * - provide "am I online"-info
 */
@Injectable()
export class RemoteSession {
  private currentDBUser: AuthUser;

  /**
   * Create a RemoteSession and set up connection to the remote CouchDB server with valid authentication.
   */
  constructor(
    private authService: AuthService,
    private loginStateSubject: LoginStateSubject,
  ) {}

  /**
   * Connect to the remote Database. Tries to determine from a possible error whether the login was rejected or the user is offline.
   */
  public login() {
    this.authService.authenticate();
  }

  public async handleSuccessfulLogin(userObject: AuthUser) {
    this.currentDBUser = userObject;
    this.loginStateSubject.next(LoginState.LOGGED_IN);
  }

  /**
   * Logout at the remote database.
   */
  public async logout(): Promise<void> {
    await this.authService.logout();
    this.currentDBUser = undefined;
    this.loginStateSubject.next(LoginState.LOGGED_OUT);
  }

  getCurrentUser(): AuthUser {
    return this.currentDBUser;
  }
}
