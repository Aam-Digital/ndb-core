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

import { Component, Optional } from "@angular/core";
import { SyncState } from "../session-states/sync-state.enum";
import { SessionService } from "../session-service/session.service";
import { LoginState } from "../session-states/login-state.enum";
import { ConnectionState } from "../session-states/connection-state.enum";
import { ActivatedRoute, Router } from "@angular/router";

/**
 * Form to allow users to enter their credentials and log in.
 */
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  /** true while a login is started but result is not received yet */
  loginInProgress = false;

  /** username as entered in form */
  username: string;

  /** password as entered in form */
  password: string;

  /** errorMessage displayed in form */
  errorMessage: string;

  constructor(
    private _sessionService: SessionService,
    @Optional() private router: Router,
    @Optional() private route: ActivatedRoute
  ) {}

  /**
   * Do a login with the SessionService.
   */
  login() {
    this.loginInProgress = true;

    this._sessionService
      .login(this.username, this.password)
      .then((loginState) => {
        if (loginState === LoginState.LOGGED_IN) {
          this.onLoginSuccess();
        } else {
          if (
            this._sessionService.getSyncState().getState() ===
              SyncState.ABORTED &&
            this._sessionService.getConnectionState().getState() ===
              ConnectionState.OFFLINE
          ) {
            this.onLoginFailure(
              $localize`Can't login for the first time when offline. Please try again later.`
            );
          } else if (
            this._sessionService.getConnectionState().getState() ===
            ConnectionState.OFFLINE
          ) {
            this.onLoginFailure(
              $localize`Username or password incorrect!
               You might also face this problem because you are currently offline.
               Please connect to the internet to synchronize the latest user data.`
            );
          } else {
            this.onLoginFailure($localize`Username or password incorrect!`);
          }
        }
      })
      .catch((reason) =>
        this.onLoginFailure(
          typeof reason === "string" ? reason : JSON.stringify(reason)
        )
      );
  }

  private onLoginSuccess() {
    // New routes are added at runtime,
    if (this.router && this.route) {
      this.router.navigate([], {
        relativeTo: this.route,
      });
    }
    this.reset();
    // login component is automatically hidden based on _sessionService.isLoggedIn()
  }

  private onLoginFailure(reason: any) {
    this.reset();
    this.errorMessage = reason;
  }

  private reset() {
    this.errorMessage = "";
    this.password = "";
    this.loginInProgress = false;
  }
}
