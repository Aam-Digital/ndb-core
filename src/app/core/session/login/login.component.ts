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

import { Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ActivatedRoute, Router } from "@angular/router";
import { LoginState } from "../session-states/login-state.enum";
import { LoginStateSubject } from "../session-type";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { SessionManagerService } from "../session-service/session-manager.service";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AuthUser } from "../auth/auth-user";
import { MatDialog } from "@angular/material/dialog";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatListModule } from "@angular/material/list";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

/**
 * Allows the user to login online or offline depending on the connection status
 */
@UntilDestroy()
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  imports: [
    MatCardModule,
    MatButtonModule,
    NgIf,
    MatProgressBarModule,
    AsyncPipe,
    MatTooltipModule,
    MatListModule,
    NgForOf,
    FontAwesomeModule,
  ],
  standalone: true,
})
export class LoginComponent {
  offlineUsers: AuthUser[] = [];
  loginInProgress = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public sessionManager: SessionManagerService,
    public loginState: LoginStateSubject,
    public siteSettingsService: SiteSettingsService,
    private dialog: MatDialog,
  ) {
    this.loginState.pipe(untilDestroyed(this)).subscribe((state) => {
      this.loginInProgress = state === LoginState.IN_PROGRESS;
      if (state === LoginState.LOGGED_IN) {
        this.routeAfterLogin();
      }
    });
    // TODO Should we only show this after a short delay when online?
    this.offlineUsers = this.sessionManager.getOfflineUsers();
  }

  private routeAfterLogin() {
    const redirectUri = this.route.snapshot.queryParams["redirect_uri"] || "";
    this.router.navigateByUrl(decodeURIComponent(redirectUri));
  }

  tryLogin() {
    return this.sessionManager.remoteLogin();
  }
}
