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
import { HttpStatusCode } from "@angular/common/http";
import { SessionService } from "./session.service";
import { LoginState } from "../session-states/login-state.enum";
import { PouchDatabase } from "../../database/pouch-database";
import { LoggingService } from "../../logging/logging.service";
import PouchDB from "pouchdb-browser";
import { AppSettings } from "../../app-settings";
import { AuthService } from "../auth/auth.service";
import { AuthUser } from "./auth-user";
import { LoginStateSubject } from "../session-type";

/**
 * Responsibilities:
 * - Hold the remote DB
 * - Handle auth against CouchDB
 * - provide "am i online"-info
 */
@Injectable()
export class RemoteSession extends SessionService {
  /** remote (!) PouchDB  */
  private readonly database: PouchDatabase;
  private currentDBUser: AuthUser;

  /**
   * Create a RemoteSession and set up connection to the remote CouchDB server with valid authentication.
   */
  constructor(
    private loggingService: LoggingService,
    private authService: AuthService,
    private loginStateSubject: LoginStateSubject,
  ) {
    super();
    this.database = new PouchDatabase(this.loggingService);
  }

  /**
   * Connect to the remote Database. Tries to determine from a possible error whether the login was rejected or the user is offline.
   */
  public login() {
    this.authService.authenticate();
  }

  public async handleSuccessfulLogin(userObject: AuthUser) {
    this.database.initRemoteDB(
      `${AppSettings.DB_PROXY_PREFIX}/${AppSettings.DB_NAME}`,
      (url, opts: any) => {
        if (typeof url === "string") {
          const remoteUrl =
            AppSettings.DB_PROXY_PREFIX +
            url.split(AppSettings.DB_PROXY_PREFIX)[1];
          return this.sendRequest(remoteUrl, opts).then((initialRes) =>
            // retry login if request failed with unauthorized
            initialRes.status === HttpStatusCode.Unauthorized
              ? this.authService
                  .autoLogin()
                  .then(() => this.sendRequest(remoteUrl, opts))
                  // return initial response if request failed again
                  .then((newRes) => (newRes.ok ? newRes : initialRes))
                  .catch(() => initialRes)
              : initialRes,
          );
        }
      },
    );
    this.currentDBUser = userObject;
    this.loginStateSubject.next(LoginState.LOGGED_IN);
  }

  private sendRequest(url: string, opts) {
    this.authService.addAuthHeader(opts.headers);
    return PouchDB.fetch(url, opts);
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

  checkPassword(username: string, password: string): boolean {
    // Cannot be checked against CouchDB due to cookie-auth
    throw Error("Can't check password in remote session");
  }

  getDatabase(): PouchDatabase {
    return this.database;
  }
}
