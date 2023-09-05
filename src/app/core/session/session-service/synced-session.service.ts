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
import { SyncState } from "../session-states/sync-state.enum";
import { filter } from "rxjs/operators";
import { AuthService } from "../auth/auth.service";
import { AuthUser } from "./auth-user";
import { SyncStateSubject } from "../session-type";

/**
 * A synced session creates and manages a LocalSession and a RemoteSession
 * and handles the setup of synchronisation.
 *
 * also see
 * [Session Handling, Authentication & Synchronisation]{@link /additional-documentation/concepts/session-and-authentication-system.html}
 */
@Injectable()
export class SyncedSessionService {
  static readonly LAST_SYNC_KEY = "LAST_SYNC";

  constructor(
    private localSession: LocalSession,
    private remoteSession: RemoteSession,
    private authService: AuthService,
    private syncState: SyncStateSubject,
  ) {
    this.syncState
      .pipe(filter((state) => state === SyncState.COMPLETED))
      .subscribe(() =>
        localStorage.setItem(
          SyncedSessionService.LAST_SYNC_KEY,
          new Date().toISOString(),
        ),
      );
  }

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
  }

  private updateLocalUser() {
    // Update local user object
    const remoteUser = this.remoteSession.getCurrentUser();
    if (remoteUser) {
      this.localSession.saveUser(remoteUser);
    }
  }
}
