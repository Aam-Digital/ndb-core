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
      const token = await this.authenticate(username, password);
      const user = await this.processToken(token);
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

  private authenticate(username: string, password: string): Promise<JwtToken> {
    const body = new URLSearchParams();
    body.set("username", username);
    body.set("password", password);
    body.set("grant_type", "password");
    return this.getToken(body);
  }

  public refreshToken(): Promise<JwtToken> {
    const body = new URLSearchParams();
    const token = localStorage.getItem(RemoteSession.REFRESH_TOKEN_KEY);
    body.set("refresh_token", token);
    body.set("grant_type", "refresh_token");
    return this.getToken(body);
  }

  private getToken(body: URLSearchParams): Promise<JwtToken> {
    body.set("client_id", "app");
    const options = {
      headers: new HttpHeaders().set(
        "Content-Type",
        "application/x-www-form-urlencoded"
      ),
    };
    return firstValueFrom(
      this.httpClient.post<JwtToken>(
        `/auth/realms/keycloak-test/protocol/openid-connect/token`,
        body.toString(),
        options
      )
    );
  }

  public async processToken(token: JwtToken): Promise<DatabaseUser> {
    this.accessToken = token.access_token;
    localStorage.setItem(RemoteSession.REFRESH_TOKEN_KEY, token.refresh_token);
    this.refreshTokenBeforeExpiry(token.expires_in);
    const parsedToken = parseJwt(this.accessToken);
    document.cookie = `KEYCLOAK_SESSION=keycloak-test/${parsedToken.sub}/${parsedToken.sid}`;
    return {
      name: parsedToken.username,
      roles: parsedToken["_couchdb.roles"],
    };
  }

  private refreshTokenBeforeExpiry(secondsTillExpiration: number) {
    // Refresh token one minute before it expires or after ten seconds
    const refreshTimeout = Math.max(10, secondsTillExpiration - 60);
    this.refreshTokenTimeout = setTimeout(async () => {
      const token = await this.refreshToken();
      await this.processToken(token);
    }, refreshTimeout * 1000);
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
  session_state: string;
}
