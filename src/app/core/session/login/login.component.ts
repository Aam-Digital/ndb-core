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
import { SessionService } from "../session-service/session.service";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ActivatedRoute, Router } from "@angular/router";
import { LoginState } from "../session-states/login-state.enum";
import { filter } from "rxjs/operators";
import { LocalSession } from "../session-service/local-session";

/**
 * Form to allow users to enter their credentials and log in.
 */
@UntilDestroy()
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  imports: [MatCardModule, MatButtonModule],
  standalone: true,
})
export class LoginComponent {
  constructor(
    private _sessionService: SessionService,
    private router: Router,
    private route: ActivatedRoute,
    private localSession: LocalSession,
  ) {
    this._sessionService.loginState
      .pipe(
        untilDestroyed(this),
        filter((state) => state === LoginState.LOGGED_IN),
      )
      .subscribe(() => this.routeAfterLogin());
  }

  private routeAfterLogin() {
    const redirectUri = this.route.snapshot.queryParams["redirect_uri"] || "";
    this.router.navigateByUrl(decodeURIComponent(redirectUri));
  }

  /**
   * Do a login with the SessionService.
   */
  login() {
    this._sessionService.login(undefined, undefined);
  }

  useOffline() {
    this.localSession.login(undefined, undefined);
  }
}
