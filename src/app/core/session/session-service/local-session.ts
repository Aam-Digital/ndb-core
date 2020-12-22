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

import { Injectable } from "@angular/core";

import { AppConfig } from "../../app-config/app-config";
import { User } from "../../user/user";

import { SyncState } from "../session-states/sync-state.enum";
import { LoginState } from "../session-states/login-state.enum";
import { StateHandler } from "../session-states/state-handler";
import { LoggingService } from "../../logging/logging.service";
import { AnalyticsService } from "../../analytics/analytics.service";
import { AlertService } from "../../alerts/alert.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

/**
 * Responsibilities:
 * - Hold the local DB
 * - Hold local user
 * - Check credentials against DB
 * - Provide the state of the synchronisation of the local db
 *   - we want to block before the first full sync
 * - Provide an interface to access the data
 */
@Injectable()
export class LocalSession {
  /** local (IndexedDb) database PouchDB */
  public database: any;
  public liveSyncHandle: any;

  /** StateHandler for login state changes */
  public loginState: StateHandler<LoginState>;
  /** StateHandler for sync state changes */
  public syncState: StateHandler<SyncState>;

  /** The currently authenticated user entity */
  public currentUser: User;

  /**
   * Create a LocalSession and set up the local PouchDB instance based on AppConfig settings.
   * @param _alertService
   * @param _entitySchemaService
   * @param _analyticsService
   */
  constructor(
    private _alertService: AlertService,
    private _entitySchemaService: EntitySchemaService
  ) {
    this.database = new PouchDB(AppConfig.settings.database.name);

    this.loginState = new StateHandler<LoginState>(LoginState.LOGGED_OUT);
    this.syncState = new StateHandler<SyncState>(SyncState.UNSYNCED);
  }

  /**
   * Get a login at the local session by fetching the user from the local database and validating the password.
   * Returns a Promise resolving with the loginState.
   * Attention: This method waits for the first synchronisation of the database (or a fail of said initial sync).
   * @param username Username
   * @param password Password
   */
  public async login(username: string, password: string): Promise<LoginState> {
    try {
      await this.waitForFirstSync();
      const userEntity = await this.loadUser(username);
      if (userEntity.checkPassword(password)) {
        this.currentUser = userEntity;
        this.currentUser.decryptCloudPassword(password);
        LoggingService.setLoggingContextUser(this.currentUser.name);
        AnalyticsService.setUser(this.currentUser.name);
        AnalyticsService.eventTrack("user_login", {
          category: "Auth",
          label: "successful",
          value: 1,
        });
        this.loginState.setState(LoginState.LOGGED_IN);
        return LoginState.LOGGED_IN;
      } else {
        this.loginState.setState(LoginState.LOGIN_FAILED);
        AnalyticsService.eventTrack("user_login", {
          category: "Auth",
          label: "failed_wrong_credentials",
          value: 0,
        });
        return LoginState.LOGIN_FAILED;
      }
    } catch (error) {
      // possible error: initial sync failed or aborted
      if (
        error &&
        error.toState &&
        [SyncState.ABORTED, SyncState.FAILED].includes(error.toState)
      ) {
        if (this.loginState.getState() === LoginState.LOGIN_FAILED) {
          AnalyticsService.eventTrack("user_login", {
            category: "Auth",
            label: "failed_sync_failed_remote_reject",
            value: 10,
          });
          // The sync failed because the remote rejected
          return LoginState.LOGIN_FAILED;
        }
        AnalyticsService.eventTrack("user_login", {
          category: "Auth",
          label: "failed_sync_failed_unknown",
          value: 20,
        });
        // The sync failed for other reasons. The user should try again
        this.loginState.setState(LoginState.LOGGED_OUT);
        return LoginState.LOGGED_OUT;
      }
      // possible error: user object not found locally, which should return loginFailed.
      if (error && error.status && error.status === 404) {
        AnalyticsService.eventTrack("user_login", {
          category: "Auth",
          label: "failed",
          value: 30,
        });
        this.loginState.setState(LoginState.LOGIN_FAILED);
        return LoginState.LOGIN_FAILED;
      }
      // all other cases must throw an error
      throw error;
    }
  }

  /**
   * Wait for the first sync of the database, returns a Promise.
   * Resolves directly, if the database is not initial, otherwise waits for the first change of the SyncState to completed (or failed)
   */
  public async waitForFirstSync() {
    if (await this.isInitial()) {
      return await this.syncState.waitForChangeTo(SyncState.COMPLETED, [
        SyncState.FAILED,
        SyncState.ABORTED,
      ]);
    }
  }

  /**
   * Check whether the local database is in an initial state.
   * This check can only be performed async, so this method returns a Promise
   */
  public isInitial(): Promise<Boolean> {
    // `doc_count === 0 => initial` is a valid assumptions, as documents for users must always be present, even after db-clean
    return this.database.info().then((result) => result.doc_count === 0);
  }

  /**
   * Logout
   */
  public logout() {
    this.currentUser = undefined;
    AnalyticsService.eventTrack("user_logout", {
      category: "Auth",
      label: "successful",
      value: 1,
    });
    this.loginState.setState(LoginState.LOGGED_OUT);
  }

  /**
   * Helper to get a User Entity from the Database without needing the EntityMapperService
   * @param userId Id of the User to be loaded
   */
  public async loadUser(userId: string): Promise<User> {
    const user = new User("");
    const userData = await this.database.get("User:" + userId);
    this._entitySchemaService.loadDataIntoEntity(user, userData);
    return user;
  }
}
