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
import { AlertService } from "../../alerts/alert.service";

import { SessionService } from "./session.service";
import { LocalSession } from "./local-session";
import { RemoteSession } from "./remote-session";
import { LoginState } from "../session-states/login-state.enum";
import { Database } from "../../database/database";
import { PouchDatabase } from "../../database/pouch-database";
import { ConnectionState } from "../session-states/connection-state.enum";
import { SyncState } from "../session-states/sync-state.enum";
import { User } from "../../user/user";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { LoggingService } from "../../logging/logging.service";
import { HttpClient } from "@angular/common/http";
import PouchDB from "pouchdb-browser";
import { AppConfig } from "../../app-config/app-config";
import { StateHandler } from "../session-states/state-handler";
import { DatabaseUser } from "./local-user";

/**
 * A synced session creates and manages a LocalSession and a RemoteSession
 * and handles the setup of synchronisation.
 *
 * also see
 * [Session Handling, Authentication & Synchronisation]{@link /additional-documentation/concepts/session-and-authentication-system.html}
 */
@Injectable()
export class SyncedSessionService extends SessionService {
  private readonly LOGIN_RETRY_TIMEOUT = 60000;
  private readonly POUCHDB_SYNC_BATCH_SIZE = 500;

  private readonly _localSession: LocalSession;
  private readonly _remoteSession: RemoteSession;
  private readonly pouchDB: PouchDB.Database;
  private readonly database: Database;
  private _liveSyncHandle: any;
  private _liveSyncScheduledHandle: any;
  private _offlineRetryLoginScheduleHandle: any;
  private syncState = new StateHandler(SyncState.UNSYNCED);

  constructor(
    private _alertService: AlertService,
    private _loggingService: LoggingService,
    private _entitySchemaService: EntitySchemaService,
    private _httpClient: HttpClient
  ) {
    super();
    this.pouchDB = new PouchDB(AppConfig.settings.database.name);
    this.database = new PouchDatabase(this.pouchDB, this._loggingService);
    this._localSession = new LocalSession(
      this.database,
      this._entitySchemaService
    );
    this._remoteSession = new RemoteSession(this._httpClient, _loggingService);
  }

  /** see {@link SessionService} */
  public isLoggedIn(): boolean {
    return this._localSession.loginState.getState() === LoginState.LOGGED_IN;
  }

  /**
   * Perform a login. The result will only be the login at the local DB, as we might be offline.
   * Calling this function will trigger a login in the background.
   * - If it is successful, a sync is performed in the background
   * - If it fails due to wrong credentials, yet the local login was successful somehow, we fail local login after the fact
   *
   * If the localSession is empty, the local login waits for the result of the sync triggered by the remote login (see local-session.ts).
   * If the remote login fails for some reason, this sync will never be performed, which is why it must be failed manually here
   * to abort the local login and prevent a deadlock.
   * @param username Username
   * @param password Password
   * @returns a promise resolving with the local LoginState
   */
  public async login(username: string, password: string): Promise<LoginState> {
    this.cancelLoginOfflineRetry(); // in case this is running in the background
    this.getSyncState().setState(SyncState.UNSYNCED);

    const remoteLogin = this._remoteSession.login(username, password);
    const syncPromise = this._remoteSession
      .getConnectionState()
      .waitForChangeTo(ConnectionState.CONNECTED)
      .then(() => this.updateLocalUserAndStartSync(password));

    let localLoginState = await this._localSession.login(username, password);

    if (localLoginState === LoginState.LOGGED_IN) {
      remoteLogin.then(() => {
        const connectionState = this._remoteSession
          .getConnectionState()
          .getState();
        if (connectionState === ConnectionState.REJECTED) {
          this.handleRemotePasswordChange(username);
        }
        if (connectionState === ConnectionState.OFFLINE) {
          this.retryLoginWhileOffline(username, password);
        }
      });
    } else {
      // Local login failed
      const remoteLoginState = await remoteLogin;
      if (remoteLoginState === LoginState.LOGGED_IN) {
        // New user or password changed
        await syncPromise;
        localLoginState = await this._localSession.login(username, password);
      } else {
        // Password wrong or offline without local users, neither local nor remote login worked
      }
    }
    return localLoginState;
  }

  private handleRemotePasswordChange(username: string) {
    this._localSession.logout();
    this._localSession.removeUser(username);
    this._localSession.loginState.setState(LoginState.LOGIN_FAILED);
    this._alertService.addDanger(
      $localize`Your password was changed recently. Please retry with your new password!`
    );
  }

  private retryLoginWhileOffline(username: string, password: string) {
    this._offlineRetryLoginScheduleHandle = setTimeout(() => {
      this.login(username, password);
    }, this.LOGIN_RETRY_TIMEOUT);
  }

  private updateLocalUserAndStartSync(password: string) {
    // Update local user object
    const remoteUser = this._remoteSession.getCurrentDBUser();
    this._localSession.saveUser(remoteUser, password);

    return this.sync()
      .then(() => this.liveSyncDeferred())
      .catch(() => {
        if (this._localSession.loginState.getState() === LoginState.LOGGED_IN) {
          this.liveSyncDeferred();
        }
      });
  }

  /** see {@link SessionService} */
  public getCurrentUser(): User {
    return this._localSession.getCurrentUser();
  }

  public getCurrentDBUser(): DatabaseUser {
    return this._localSession.getCurrentDBUser();
  }

  public checkPassword(username: string, password: string): boolean {
    // This only checks the password against locally saved users
    return this._localSession.checkPassword(username, password);
  }

  /** see {@link SessionService} */
  public getLoginState() {
    return this._localSession.loginState;
  }
  /** see {@link SessionService} */
  public getConnectionState() {
    return this._remoteSession.getConnectionState();
  }
  /** see {@link SessionService} */
  public getSyncState() {
    return this.syncState;
  }

  /** see {@link SessionService} */
  public async sync(): Promise<any> {
    this.getSyncState().setState(SyncState.STARTED);
    try {
      const result = await this.pouchDB.sync(this._remoteSession.pouchDB, {
        batch_size: this.POUCHDB_SYNC_BATCH_SIZE,
      });
      this.getSyncState().setState(SyncState.COMPLETED);
      return result;
    } catch (error) {
      this.getSyncState().setState(SyncState.FAILED);
      throw error; // rethrow, so later Promise-handling lands in .catch, too
    }
  }

  /**
   * Start live sync in background.
   */
  public liveSync() {
    this.cancelLiveSync(); // cancel any liveSync that may have been alive before
    this.getSyncState().setState(SyncState.STARTED);
    this._liveSyncHandle = (this.pouchDB.sync(this._remoteSession.pouchDB, {
      live: true,
      retry: true,
    }) as any)
      .on("change", (change) => {
        // after sync. change has direction and changes with info on errors etc
      })
      .on("paused", (info) => {
        // replication was paused: either because sync is finished or because of a failed sync (mostly due to lost connection). info is empty.
        if (this.getConnectionState().getState() !== ConnectionState.OFFLINE) {
          this.getSyncState().setState(SyncState.COMPLETED);
          // We might end up here after a failed sync that is not due to offline errors.
          // It shouldn't happen too often, as we have an initial non-live sync to catch those situations, but we can't find that out here
        }
      })
      .on("active", (info) => {
        // replication was resumed: either because new things to sync or because connection is available again. info contains the direction
        this.getSyncState().setState(SyncState.STARTED);
      })
      .on("error", (err) => {
        // totally unhandled error (shouldn't happen)
        console.error("sync failed", err);
        this.getSyncState().setState(SyncState.FAILED);
      })
      .on("complete", (info) => {
        // replication was canceled!
        this._liveSyncHandle = null;
      });
    return this._liveSyncHandle;
  }

  /**
   * Schedules liveSync to be started.
   * This method should be used to start the liveSync after the initial non-live sync,
   * so the browser makes a round trip to the UI and hides the potentially visible first-sync dialog.
   * @param timeout ms to wait before starting the liveSync
   */
  public liveSyncDeferred(timeout = 1000) {
    this.cancelLiveSync(); // cancel any liveSync that may have been alive before
    this._liveSyncScheduledHandle = setTimeout(() => this.liveSync(), timeout);
  }

  /**
   * Cancels a pending login retry scheduled to start in the future.
   */
  public cancelLoginOfflineRetry() {
    if (this._offlineRetryLoginScheduleHandle) {
      clearTimeout(this._offlineRetryLoginScheduleHandle);
    }
  }

  /**
   * Cancels a currently running liveSync or a liveSync scheduled to start in the future.
   */
  public cancelLiveSync() {
    if (this._liveSyncScheduledHandle) {
      clearTimeout(this._liveSyncScheduledHandle);
    }
    if (this._liveSyncHandle) {
      this._liveSyncHandle.cancel();
    }
  }

  /**
   * Get the local database instance that should be used for regular data access.
   * als see {@link SessionService}
   */
  public getDatabase(): Database {
    return this.database;
  }

  /**
   * Logout and stop any existing sync.
   * also see {@link SessionService}
   */
  public logout() {
    this.cancelLoginOfflineRetry();
    this.cancelLiveSync();
    this._localSession.logout();
    this._remoteSession.logout();
  }
}
