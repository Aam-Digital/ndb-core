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

import { Injector, NgModule } from "@angular/core";
import { SyncedSessionService } from "./session-service/synced-session.service";
import { LocalSession } from "./session-service/local-session";
import { RemoteSession } from "./session-service/remote-session";
import { SessionService } from "./session-service/session.service";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "./session-type";
import { environment } from "../../../environments/environment";
import { AuthService } from "./auth/auth.service";
import { KeycloakAuthService } from "./auth/keycloak/keycloak-auth.service";
import { CouchdbAuthService } from "./auth/couchdb/couchdb-auth.service";
import { AuthProvider } from "./auth/auth-provider";
import { serviceProvider } from "../../utils/utils";
import { KeycloakAngularModule } from "keycloak-angular";

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
    SyncedSessionService,
    LocalSession,
    RemoteSession,
    serviceProvider(SessionService, (injector: Injector) => {
      return environment.session_type === SessionType.synced
        ? injector.get(SyncedSessionService)
        : injector.get(LocalSession);
    }),
    KeycloakAuthService,
    CouchdbAuthService,
    serviceProvider(AuthService, (injector: Injector) => {
      return environment.authenticator === AuthProvider.Keycloak
        ? injector.get(KeycloakAuthService)
        : injector.get(CouchdbAuthService);
    }),
    LoginStateSubject,
    SyncStateSubject,
  ],
})
export class SessionModule {
  constructor(syncedSession: SyncedSessionService) {
    // TODO maybe move to app initializer
    syncedSession.checkForValidSession();
  }
}
