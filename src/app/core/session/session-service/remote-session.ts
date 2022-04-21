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
import { AppConfig } from "../../app-config/app-config";
import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { DatabaseUser } from "./local-user";
import { SessionService } from "./session.service";
import { LoginState } from "../session-states/login-state.enum";
import { PouchDatabase } from "../../database/pouch-database";
import { LoggingService } from "../../logging/logging.service";

/**
 * Responsibilities:
 * - Hold the remote DB
 * - Handle auth against CouchDB
 * - provide "am i online"-info
 */
@Injectable()
export class RemoteSession extends SessionService {
  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
  readonly UNAUTHORIZED_STATUS_CODE = 401;
  /** remote (!) PouchDB  */
  private readonly database: PouchDatabase;
  private currentDBUser: DatabaseUser;

  /**
   * Create a RemoteSession and set up connection to the remote CouchDB server configured in AppConfig.
   */
  constructor(
    private httpClient: HttpClient,
    private loggingService: LoggingService
  ) {
    super();
    this.database = new PouchDatabase(this.loggingService).initIndexedDB(
      AppConfig.settings.database.remote_url + AppConfig.settings.database.name,
      {
        skip_setup: true,
      }
    );
  }

  /**
   * Connect to the remote Database. Tries to determine from a possible error whether the login was rejected or the user is offline.
   * @param username Username
   * @param password Password
   */
  public async login(username: string, password: string): Promise<LoginState> {
    try {
      const response = await this.httpClient
        .post<DatabaseUser>(
          `${AppConfig.settings.database.remote_url}_session`,
          { name: username, password: password },
          { withCredentials: true }
        )
        .toPromise();
      this.loginUser(response);
    } catch (error) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === this.UNAUTHORIZED_STATUS_CODE) {
        this.loginState.next(LoginState.LOGIN_FAILED);
      } else {
        this.loginState.next(LoginState.UNAVAILABLE);
      }
    }
    return this.loginState.value;
  }

  public loginUser(userObject: DatabaseUser) {
    this.currentDBUser = userObject;
    this.loginState.next(LoginState.LOGGED_IN);
  }

  /**
   * Logout at the remote database.
   */
  public async logout(): Promise<void> {
    await this.httpClient
      .delete(`${AppConfig.settings.database.remote_url}_session`, {
        withCredentials: true,
      })
      .toPromise()
      .catch(() => undefined);
    this.currentDBUser = undefined;
    this.loginState.next(LoginState.LOGGED_OUT);
  }

  getCurrentUser(): DatabaseUser {
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
