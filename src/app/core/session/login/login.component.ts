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

import { Component, OnInit, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ActivatedRoute, Router } from "@angular/router";
import { LoginState } from "../session-states/login-state.enum";
import { LoginStateSubject } from "../session-type";
import { AsyncPipe, Location } from "@angular/common";
import { SessionManagerService } from "../session-service/session-manager.service";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { SessionInfo } from "../auth/session-info";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatListModule } from "@angular/material/list";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { waitForChangeTo } from "../session-states/session-utils";
import { race, timer } from "rxjs";

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
    MatProgressBarModule,
    AsyncPipe,
    MatTooltipModule,
    MatListModule,
    FontAwesomeModule,
  ],
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  sessionManager = inject(SessionManagerService);
  loginState = inject(LoginStateSubject);
  siteSettingsService = inject(SiteSettingsService);
  location = inject(Location);

  offlineUsers: SessionInfo[] = [];
  enableOfflineLogin: boolean;
  loginInProgress = false;

  constructor() {
    const sessionManager = this.sessionManager;

    this.enableOfflineLogin = !this.sessionManager.remoteLoginAvailable();

    sessionManager
      .remoteLogin()
      .then(() => sessionManager.clearRemoteSessionIfNecessary());
  }

  ngOnInit() {
    this.loginState.pipe(untilDestroyed(this)).subscribe((state) => {
      this.loginInProgress = state === LoginState.IN_PROGRESS;
      if (state === LoginState.LOGGED_IN) {
        this.routeAfterLogin();
      }
    });

    this.offlineUsers = this.sessionManager.getOfflineUsers();
    race(
      this.loginState.pipe(waitForChangeTo(LoginState.LOGIN_FAILED)),
      timer(10000),
    ).subscribe(() => {
      this.enableOfflineLogin = true;
    });
  }

  private routeAfterLogin() {
    const redirectUri = this.route.snapshot.queryParams["redirect_uri"] || "";
    const safeRedirectUri = this.safeRedirectUrl(redirectUri);
    this.router.navigateByUrl(safeRedirectUri);
  }

  private safeRedirectUrl(redirectUri: string): string {
    if (!redirectUri) return "/";

    try {
      const decodedUri = decodeURIComponent(redirectUri);
      const base = window.location.origin;
      const fullUrl = new URL(decodedUri, base);

      // validate same origin and path
      if (fullUrl.origin !== base || !fullUrl.pathname.startsWith("/")) {
        return "/";
      }

      return fullUrl.pathname + fullUrl.search + fullUrl.hash;
    } catch (e) {
      return "/"; // fallback for invalid urls
    }
  }

  tryLogin() {
    return this.sessionManager.remoteLogin();
  }
}
