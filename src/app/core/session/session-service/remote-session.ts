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

/**
 * Responsibilities:
 * - Hold the remote DB
 * - Handle auth against CouchDB
 * - provide "am i online"-info
 */
@Injectable()
export class RemoteSession {
  /** remote (!) database PouchDB */
  public database: PouchDB.Database;

  /** state of the remote connection */
  public connectionState = new StateHandler(ConnectionState.DISCONNECTED);

  private currentUser: DatabaseUser;

  /**
   * Create a RemoteSession and set up connection to the remote CouchDB server configured in AppConfig.
   */
  constructor(private httpClient: HttpClient) {
    const thisRemoteSession = this;
    this.database = new PouchDB(
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
              thisRemoteSession.connectionState.getState() ===
              ConnectionState.OFFLINE
            ) {
              thisRemoteSession.connectionState.setState(
                ConnectionState.CONNECTED
              );
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
              thisRemoteSession.connectionState.getState() ===
                ConnectionState.CONNECTED
            ) {
              thisRemoteSession.connectionState.setState(
                ConnectionState.OFFLINE
              );
            }
            throw error;
          });
          return req;
        },
        skip_setup: true,
      } as PouchDB.Configuration.RemoteDatabaseConfiguration
    );
  }

  /**
   * Connect to the remote Database. Tries to determine from a possible error whether the login was rejected or the user is offline.
   * @param username Username
   * @param password Password
   */
  public async login(
    username: string,
    password: string
  ): Promise<ConnectionState> {
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
      return ConnectionState.CONNECTED;
    } catch (error) {
      const errorStatus = error?.statusText?.toLowerCase();
      if (errorStatus === "unauthorized" || errorStatus === "forbidden") {
        this.connectionState.setState(ConnectionState.REJECTED);
        return ConnectionState.REJECTED;
      } else {
        this.connectionState.setState(ConnectionState.OFFLINE);
        return ConnectionState.OFFLINE;
      }
    }
  }

  private assignDatabaseUser(couchDBResponse: any) {
    this.currentUser = {
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
    this.currentUser = undefined;
    this.connectionState.setState(ConnectionState.DISCONNECTED);
  }

  getCurrentUser(): DatabaseUser {
    return this.currentUser;
  }
}
