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
import { CommonModule } from "@angular/common";
import { LoginComponent } from "./login/login.component";
import { FormsModule } from "@angular/forms";
import { EntityModule } from "../entity/entity.module";
import { AlertsModule } from "../alerts/alerts.module";
import { sessionServiceProvider } from "./session.service.provider";
import { UserModule } from "../user/user.module";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RouterModule } from "@angular/router";
import { HttpClientModule } from "@angular/common/http";
import { Database } from "../database/database";
import { PouchDatabase } from "../database/pouch-database";
import { MatDialogModule } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";

/**
 * The core session logic handling user login as well as connection and synchronization with the remote database.
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
    sessionServiceProvider,
    { provide: Database, useClass: PouchDatabase },
  ],
})
export class SessionModule {}
