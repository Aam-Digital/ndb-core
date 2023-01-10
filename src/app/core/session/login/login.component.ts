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

import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { SessionService } from "../session-service/session.service";
import { LoginState } from "../session-states/login-state.enum";
import { LoggingService } from "../../logging/logging.service";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { PasswordResetComponent } from "../auth/keycloak/password-reset/password-reset.component";
import { ActivatedRoute, Router } from "@angular/router";
import { filter } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

/**
 * Form to allow users to enter their credentials and log in.
 */
@UntilDestroy()
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatButtonModule,
    PasswordResetComponent,
  ],
  standalone: true,
})
export class LoginComponent implements AfterViewInit {
  /** true while a login is started but result is not received yet */
  loginInProgress = false;

  /** username as entered in form */
  username: string;

  /** password as entered in form */
  password: string;

  /** whether to show or hide the password */
  passwordVisible: boolean = false;
  readonly showPasswordHint = $localize`:Tooltip text for showing the password:Show password`;
  readonly hidePasswordHint = $localize`:Tooltip text for hiding the password:Hide password`;

  /** errorMessage displayed in form */
  errorMessage: string;

  @ViewChild("usernameInput") usernameInput: ElementRef;

  constructor(
    private _sessionService: SessionService,
    private loggingService: LoggingService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this._sessionService.loginState
      .pipe(
        untilDestroyed(this),
        filter((state) => state === LoginState.LOGGED_IN)
      )
      .subscribe(() => this.routeAfterLogin());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.usernameInput?.nativeElement.focus());
  }

  private routeAfterLogin() {
    const redirectUri = this.route.snapshot.queryParams["redirect_uri"] || "";
    this.router.navigateByUrl(decodeURIComponent(redirectUri));
  }

  /**
   * Do a login with the SessionService.
   */
  login() {
    this.loginInProgress = true;
    this.errorMessage = "";

    this._sessionService
      .login(this.username?.trim(), this.password)
      .then((loginState) => {
        switch (loginState) {
          case LoginState.LOGGED_IN:
            this.reset();
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
            throw new Error(`Unexpected login state: ${loginState}`);
        }
      })
      .catch((reason) => {
        this.loggingService.error(`Unexpected login error: ${reason}`);
        this.onLoginFailure($localize`:LoginError:An unexpected error occurred.
          Please reload the the page and try again.
          If you keep seeing this error message, please contact your system administrator.
        `);
      });
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

  togglePasswordVisible() {
    this.passwordVisible = !this.passwordVisible;
  }
}
