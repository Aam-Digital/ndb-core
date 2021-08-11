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
import { LoginState } from "../session-states/login-state.enum";
import { ActivatedRoute, Router } from "@angular/router";
import { LoggingService } from "../../logging/logging.service";

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
    private loggingService: LoggingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /**
   * Do a login with the SessionService.
   */
  login() {
    this.loginInProgress = true;
    this.errorMessage = "";

    this._sessionService
      .login(this.username, this.password)
      .then((loginState) => {
        switch (loginState) {
          case LoginState.LOGGED_IN:
            this.onLoginSuccess();
            break;
          case LoginState.UNAVAILABLE:
            this.onLoginFailure(
              $localize`:LoginError:Please connect to the internet and try again`
            );
            break;
          case LoginState.LOGIN_FAILED:
            this.onLoginFailure(
              $localize`:LoginError:Username and/or password incorrect`
            );
            break;
          default:
            throw new Error(
              $localize`:LoginError:Unexpected login state: ${loginState}`
            );
        }
      })
      .catch((reason) => {
        this.loggingService.error(`Unexpected login error: ${reason}`);
        this.onLoginFailure($localize`
          :LoginError:An unexpected error occurred.
          Please reload the the page and try again.
          If you keep seeing this error message, please contact your system administrator.
        `);
      });
  }

  private onLoginSuccess() {
    // New routes are added at runtime
    this.router.navigate([], {
      relativeTo: this.route,
    });
    this.reset();
    // login component is automatically hidden based on _sessionService.isLoggedIn()
  }

  private onLoginFailure(reason: string) {
    this.reset();
    this.errorMessage = reason;
  }

  private reset() {
    this.errorMessage = "";
    this.password = "";
    this.loginInProgress = false;
  }
}
