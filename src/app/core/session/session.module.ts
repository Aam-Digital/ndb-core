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
import { FormsModule } from "@angular/forms";
import { EntityModule } from "../entity/entity.module";
import { AlertsModule } from "../alerts/alerts.module";
import { UserModule } from "../user/user.module";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RouterModule } from "@angular/router";
import { HttpClientModule } from "@angular/common/http";
import { MatDialogModule } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { SyncedSessionService } from "./session-service/synced-session.service";
import { LocalSession } from "./session-service/local-session";
import { RemoteSession } from "./session-service/remote-session";
import { SessionService } from "./session-service/session.service";
import { AppConfig } from "../app-config/app-config";
import { SessionType } from "./session-type";

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
    UserModule,
    HttpClientModule,
    MatDialogModule,
    MatProgressBarModule,
  ],
  declarations: [LoginComponent],
  exports: [LoginComponent],
  providers: [
    SyncedSessionService,
    LocalSession,
    RemoteSession,
    {
      provide: SessionService,
      useFactory: (injector: Injector) => {
        if (AppConfig?.settings?.session_type === SessionType.synced) {
          return injector.get(SyncedSessionService);
        } else {
          return injector.get(LocalSession);
        }
      },
      deps: [Injector],
    },
  ],
})
export class SessionModule {}
