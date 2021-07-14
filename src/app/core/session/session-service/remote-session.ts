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
import PouchDBAuthentication from "pouchdb-authentication";

import { AppConfig } from "../../app-config/app-config";
import { Injectable } from "@angular/core";
import { StateHandler } from "../session-states/state-handler";
import { ConnectionState } from "../session-states/connection-state.enum";

PouchDB.plugin(PouchDBAuthentication);

/**
 * Responsibilities:
 * - Hold the remote DB
 * - Handle auth
 * - provide "am i online"-info
 */
@Injectable()
export class RemoteSession {
  /** remote (!) database PouchDB */
  public database: any;

  /** state of the remote connection */
  public connectionState: StateHandler<ConnectionState> =
    new StateHandler<ConnectionState>(ConnectionState.DISCONNECTED);

  /**
   * Create a RemoteSession and set up connection to the remote database CouchDB server configured in AppConfig.
   */
  constructor() {
    const thisRemoteSession = this;
    this.database = new PouchDB(
      AppConfig.settings.database.remote_url + AppConfig.settings.database.name,
      {
        ajax: {
          rejectUnauthorized: false,
          timeout: 60000,
        },
        // This is a workaround for PouchDB 7.0.0 with pouchdb-authentication 1.1.3:
        // https://github.com/pouchdb-community/pouchdb-authentication/issues/239
        // It is necessary, until this merged PR will be published in PouchDB 7.0.1
        // https://github.com/pouchdb/pouchdb/pull/7395
        fetch(url, opts) {
          opts.credentials = "include";
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
    const ajaxOpts = {
      ajax: {
        headers: {
          Authorization: "Basic " + window.btoa(username + ":" + password),
        },
      },
    };

    try {
      await this.database.login(username, password, ajaxOpts);
      this.connectionState.setState(ConnectionState.CONNECTED);
      return ConnectionState.CONNECTED;
    } catch (error) {
      if (error.name === "unauthorized" || error.name === "forbidden") {
        this.connectionState.setState(ConnectionState.REJECTED);
        return ConnectionState.REJECTED;
      } else {
        this.connectionState.setState(ConnectionState.OFFLINE);
        return ConnectionState.OFFLINE;
      }
    }
  }

  /**
   * Logout at the remote database.
   */
  public logout(): void {
    this.database.logout();
    this.connectionState.setState(ConnectionState.DISCONNECTED);
  }
}
