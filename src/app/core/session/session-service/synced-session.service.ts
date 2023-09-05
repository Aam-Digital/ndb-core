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

import { LocalSession } from "./local-session";
import { RemoteSession } from "./remote-session";
import { AuthService } from "../auth/auth.service";
import { AuthUser } from "./auth-user";
import { SyncService } from "../../database/sync.service";

/**
 * A synced session creates and manages a LocalSession and a RemoteSession
 * and handles the setup of synchronisation.
 *
 * also see
 * [Session Handling, Authentication & Synchronisation]{@link /additional-documentation/concepts/session-and-authentication-system.html}
 */
@Injectable()
export class SyncedSessionService {
  constructor(
    private localSession: LocalSession,
    private remoteSession: RemoteSession,
    private authService: AuthService,
    private syncService: SyncService,
  ) {}

  /**
   * Do log in automatically if there is still a valid CouchDB cookie from last login with username and password
   */
  checkForValidSession() {
    return this.authService
      .autoLogin()
      .then((user) => this.handleSuccessfulLogin(user))
      .catch(() => undefined);
  }

  async handleSuccessfulLogin(userObject: AuthUser) {
    await this.localSession.handleSuccessfulLogin(userObject);
    await this.remoteSession.handleSuccessfulLogin(userObject);
    this.updateLocalUser();
    await this.syncService.startSync();
  }

  private updateLocalUser() {
    // Update local user object
    const remoteUser = this.remoteSession.getCurrentUser();
    if (remoteUser) {
      this.localSession.saveUser(remoteUser);
    }
  }
}
