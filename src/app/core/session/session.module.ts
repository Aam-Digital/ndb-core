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

import { NgModule } from "@angular/core";
import { SessionManagerService } from "./session-service/session-manager.service";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "./session-type";
import { KeycloakAuthService } from "./auth/keycloak/keycloak-auth.service";
import { KeycloakAngularModule } from "keycloak-angular";
import { environment } from "../../../environments/environment";

/**
 * The core session logic handling user login as well as connection and synchronization with the remote database.
 * To access the currently active session inject the `SessionService` into your component/service.
 * What session you get varies depending on the `session_type` setting in the `config.json`.
 *
 * A detailed discussion about the Session concept is available separately:
 * [Session Handling, Authentication & Synchronisation]{@link /additional-documentation/concepts/session-and-authentication-system.html}
 */
@NgModule({
  imports: [KeycloakAngularModule],
  providers: [
    SessionManagerService,
    KeycloakAuthService,
    LoginStateSubject,
    SyncStateSubject,
  ],
})
export class SessionModule {
  constructor(sessionManager: SessionManagerService) {
    if (navigator.onLine && environment.session_type === SessionType.synced) {
      this.initialiseRemoteSession(sessionManager);
    }
  }

  private async initialiseRemoteSession(sessionManager: SessionManagerService) {
    await sessionManager.remoteLogin();
    await sessionManager.clearRemoteSessionIfNecessary();
  }
}
