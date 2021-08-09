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

import PouchDB from "pouchdb-browser";

import { AppConfig } from "../../app-config/app-config";
import { Injectable } from "@angular/core";
import { StateHandler } from "../session-states/state-handler";
import { ConnectionState } from "../session-states/connection-state.enum";
import { HttpClient } from "@angular/common/http";
import { DatabaseUser } from "./local-user";
import { SyncState } from "../session-states/sync-state.enum";
import { SessionService } from "./session.service";
import { LoginState } from "../session-states/login-state.enum";
import { Database } from "../../database/database";
import { User } from "../../user/user";
import { PouchDatabase } from "../../database/pouch-database";
import { LoggingService } from "../../logging/logging.service";

/**
 * Responsibilities:
 * - Hold the remote DB
 * - Handle auth against CouchDB
 * - provide "am i online"-info
 */
@Injectable()
export class RemoteSession implements SessionService {
  /** remote (!) database PouchDB */
  public pouchDB: PouchDB.Database;
  private readonly database: Database;

  /** state of the remote connection */
  private connectionState = new StateHandler(ConnectionState.DISCONNECTED);
  private loginState = new StateHandler(LoginState.LOGGED_OUT);

  private currentDBUser: DatabaseUser;

  /**
   * Create a RemoteSession and set up connection to the remote CouchDB server configured in AppConfig.
   */
  constructor(
    private httpClient: HttpClient,
    private loggingService: LoggingService
  ) {
    const thisRemoteSession = this;
    this.pouchDB = new PouchDB(
      AppConfig.settings.database.remote_url + AppConfig.settings.database.name,
      {
        ajax: {
          rejectUnauthorized: false,
          timeout: 60000,
        },
        // TODO remove connection state and this code
        fetch(url, opts) {
          const req = fetch(url, opts);
          req.then((result) => {
            if (
              thisRemoteSession.getConnectionState().getState() ===
              ConnectionState.OFFLINE
            ) {
              thisRemoteSession
                .getConnectionState()
                .setState(ConnectionState.CONNECTED);
            }
            return result;
          });
          req.catch((error) => {
            // fetch will throw on network errors, giving us a chance to check the online status
            // if we are offline at the start, this will already be set on login, so we need not check that initial condition here
            // do not set offline on AbortErrors, as these are fine:
            // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Exceptions
            if (
              error.name !== "AbortError" &&
              thisRemoteSession.getConnectionState().getState() ===
                ConnectionState.CONNECTED
            ) {
              thisRemoteSession
                .getConnectionState()
                .setState(ConnectionState.OFFLINE);
            }
            throw error;
          });
          return req;
        },
        skip_setup: true,
      } as PouchDB.Configuration.RemoteDatabaseConfiguration
    );
    this.database = new PouchDatabase(this.pouchDB, this.loggingService);
  }

  /**
   * Connect to the remote Database. Tries to determine from a possible error whether the login was rejected or the user is offline.
   * @param username Username
   * @param password Password
   */
  public async login(username: string, password: string): Promise<LoginState> {
    try {
      const response = await this.httpClient
        .post(
          `${AppConfig.settings.database.remote_url}_session`,
          { name: username, password: password },
          { withCredentials: true }
        )
        .toPromise();
      this.assignDatabaseUser(response);
      this.connectionState.setState(ConnectionState.CONNECTED);
      this.loginState.setState(LoginState.LOGGED_IN);
    } catch (error) {
      const errorStatus = error?.statusText?.toLowerCase();
      if (errorStatus === "unauthorized" || errorStatus === "forbidden") {
        this.connectionState.setState(ConnectionState.REJECTED);
        this.loginState.setState(LoginState.LOGIN_FAILED);
      } else {
        this.connectionState.setState(ConnectionState.OFFLINE);
        this.loginState.setState(LoginState.LOGIN_FAILED);
      }
    }
    return this.loginState.getState();
  }

  private assignDatabaseUser(couchDBResponse: any) {
    this.currentDBUser = {
      name: couchDBResponse.name,
      roles: couchDBResponse.roles,
    };
  }

  /**
   * Logout at the remote database.
   */
  public async logout(): Promise<void> {
    await this.httpClient
      .delete(`${AppConfig.settings.database.remote_url}_session`, {
        withCredentials: true,
      })
      .toPromise();
    this.currentDBUser = undefined;
    this.connectionState.setState(ConnectionState.DISCONNECTED);
    this.loginState.setState(LoginState.LOGGED_OUT);
  }

  getCurrentDBUser(): DatabaseUser {
    return this.currentDBUser;
  }

  checkPassword(username: string, password: string): boolean {
    // Cannot be checked against CouchDB due to cookie-auth
    return false;
  }

  getConnectionState(): StateHandler<ConnectionState> {
    return this.connectionState;
  }

  getCurrentUser(): User {
    return undefined;
  }

  getDatabase(): Database {
    return this.database;
  }

  getLoginState(): StateHandler<LoginState> {
    return this.loginState;
  }

  getSyncState(): StateHandler<SyncState> {
    return new StateHandler(SyncState.UNSYNCED);
  }

  isLoggedIn(): boolean {
    return this.loginState.getState() === LoginState.LOGGED_IN;
  }

  sync(): Promise<any> {
    return Promise.reject(new Error("Cannot sync remote session"));
  }
}
