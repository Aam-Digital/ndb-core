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
import { CommonModule } from "@angular/common";
import { LoginComponent } from "./login/login.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EntityModule } from "../entity/entity.module";
import { AlertsModule } from "../alerts/alerts.module";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyCardModule as MatCardModule } from "@angular/material/legacy-card";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { RouterModule } from "@angular/router";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";
import { SyncedSessionService } from "./session-service/synced-session.service";
import { LocalSession } from "./session-service/local-session";
import { RemoteSession } from "./session-service/remote-session";
import { SessionService } from "./session-service/session.service";
import { SessionType } from "./session-type";
import { environment } from "../../../environments/environment";
import { AuthService } from "./auth/auth.service";
import { KeycloakAuthService } from "./auth/keycloak/keycloak-auth.service";
import { CouchdbAuthService } from "./auth/couchdb/couchdb-auth.service";
import { AuthProvider } from "./auth/auth-provider";
import { PasswordFormComponent } from "./auth/couchdb/password-form/password-form.component";
import { AccountPageComponent } from "./auth/keycloak/account-page/account-page.component";
import { Angulartics2OnModule } from "angulartics2";
import { PasswordResetComponent } from "./auth/keycloak/password-reset/password-reset.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { AuthInterceptor } from "./auth/auth.interceptor";
import { serviceProvider } from "../../utils/utils";

/**
 * The core session logic handling user login as well as connection and synchronization with the remote database.
 * To access the currently active session inject the `SessionService` into your component/service.
 * What session you get varies depending on the `session_type` setting in the `config.json`.
 *
 * A detailed discussion about the Session concept is available separately:
 * [Session Handling, Authentication & Synchronisation]{@link /additional-documentation/concepts/session-and-authentication-system.html}
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EntityModule,
    AlertsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterModule,
    HttpClientModule,
    MatDialogModule,
    MatProgressBarModule,
    Angulartics2OnModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  declarations: [
    LoginComponent,
    PasswordFormComponent,
    AccountPageComponent,
    PasswordResetComponent,
  ],
  exports: [LoginComponent, AccountPageComponent, PasswordFormComponent],
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
})
export class SessionModule {}
