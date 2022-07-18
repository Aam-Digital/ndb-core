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
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { DatabaseUser } from "./local-user";
import { SessionService } from "./session.service";
import { LoginState } from "../session-states/login-state.enum";
import { PouchDatabase } from "../../database/pouch-database";
import { LoggingService } from "../../logging/logging.service";
import PouchDB from "pouchdb-browser";
import { firstValueFrom } from "rxjs";
import { parseJwt } from "../../../utils/utils";

/**
 * Responsibilities:
 * - Hold the remote DB
 * - Handle auth against CouchDB
 * - provide "am i online"-info
 */
@Injectable()
export class RemoteSession extends SessionService {
  static readonly LAST_LOGIN_KEY = "LAST_REMOTE_LOGIN";
  static readonly REFRESH_TOKEN_KEY = "REFRESH_TOKEN";
  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
  static readonly UNAUTHORIZED_STATUS_CODE = 401;
  /** remote (!) PouchDB  */
  private readonly database: PouchDatabase;
  private currentDBUser: DatabaseUser;

  public accessToken: string;
  private refreshTokenTimeout;

  /**
   * Create a RemoteSession and set up connection to the remote CouchDB server configured in AppConfig.
   */
  constructor(
    private httpClient: HttpClient,
    private loggingService: LoggingService
  ) {
    super();
    this.database = new PouchDatabase(this.loggingService);
  }

  /**
   * Connect to the remote Database. Tries to determine from a possible error whether the login was rejected or the user is offline.
   * @param username Username
   * @param password Password
   */
  public async login(username: string, password: string): Promise<LoginState> {
    try {
      let user = await this.verifyCredentials(username, password);
      await this.handleSuccessfulLogin(user);
      localStorage.setItem(
        RemoteSession.LAST_LOGIN_KEY,
        new Date().toISOString()
      );
      this.loginState.next(LoginState.LOGGED_IN);
    } catch (error) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === RemoteSession.UNAUTHORIZED_STATUS_CODE) {
        this.loginState.next(LoginState.LOGIN_FAILED);
      } else {
        this.loginState.next(LoginState.UNAVAILABLE);
      }
    }
    return this.loginState.value;
  }

  private async verifyCredentials(
    username: string,
    password: string
  ): Promise<DatabaseUser> {
    const { body, options } = this.buildAuthRequest(username, password);
    const response = await firstValueFrom(
      this.httpClient.post<JwtToken>(`/auth`, body.toString(), options)
    );
    this.accessToken = response.access_token;
    this.refreshTokenBeforeExpiry(response.expires_in, response.refresh_token);
    localStorage.setItem(
      RemoteSession.REFRESH_TOKEN_KEY,
      response.refresh_token
    );
    const parsedToken = parseJwt(this.accessToken);
    return {
      name: parsedToken.sub,
      roles: parsedToken["_couchdb.roles"],
    };
  }

  private buildAuthRequest(username: string, password: string) {
    const body = new URLSearchParams();
    if (username) {
      body.set("username", username);
      body.set("password", password);
      body.set("grant_type", "password");
    } else {
      body.set("refresh_token", password);
      body.set("grant_type", "refresh_token");
    }
    body.set("client_id", "myclient");
    const options = {
      headers: new HttpHeaders().set(
        "Content-Type",
        "application/x-www-form-urlencoded"
      ),
    };
    return { body, options };
  }

  private refreshTokenBeforeExpiry(
    secondsTillExpiration: number,
    refreshToken: string
  ) {
    // Refresh token one minute before it expires or after ten seconds
    const refreshTimeout = Math.max(10, secondsTillExpiration - 60);
    this.refreshTokenTimeout = setTimeout(
      () => this.verifyCredentials("", refreshToken),
      refreshTimeout * 1000
    );
  }

  public async handleSuccessfulLogin(userObject: DatabaseUser) {
    this.database.initIndexedDB(
      AppConfig.settings.database.remote_url + AppConfig.settings.database.name,
      {
        skip_setup: true,
        fetch: (url, opts: any) => {
          opts.headers.set("Authorization", "Bearer " + this.accessToken);
          return PouchDB.fetch(url, opts);
        },
      }
    );
    this.currentDBUser = userObject;
    this.loginState.next(LoginState.LOGGED_IN);
  }

  /**
   * Logout at the remote database.
   */
  public logout(): void {
    clearTimeout(this.refreshTokenTimeout);
    window.localStorage.removeItem(RemoteSession.REFRESH_TOKEN_KEY);
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

export interface JwtToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
