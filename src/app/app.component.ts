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
import { NavigationEnd, Router } from "@angular/router";
import { filter, take } from "rxjs/operators";
import { ConfigService } from "./core/config/config.service";
import { LoginStateSubject } from "./core/session/session-type";
import { LoginState } from "./core/session/session-states/login-state.enum";
import { SetupService } from "./core/setup/setup.service";

/**
 * Component as the main entry point for the app.
 * Actual logic and UI structure is defined in other modules.
 */
@Component({
  selector: "app-root",
  template: `@if (
      !configReady && (loginState | async) === LoginState.LOGGED_IN
    ) {
      <app-application-loading></app-application-loading>
    } @else if (configFullscreen) {
      <router-outlet></router-outlet>
    } @else {
      <app-ui></app-ui>
    }`,
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
export class AppComponent {
  configFullscreen: boolean = false;
  configReady: boolean = false;

  constructor(
    private router: Router,
    private configService: ConfigService,
    protected loginState: LoginStateSubject,
    private setupService: SetupService,
  ) {
    this.setupService.openDemoSetupDialog();

    this.detectConfigReadyState();
    this.detectConfigMode();
    router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.detectConfigMode());
  }

  /**
   * Check if we are currently still waiting for config to be initialized or downloaded
   * and keep the app on the loading screen until that is done.
   * @private
   */
  private detectConfigReadyState() {
    this.configService.configUpdates
      .pipe(
        filter((c) => c !== undefined),
        take(1),
      )
      .subscribe(() => (this.configReady = true));
  }

  /**
   * Switch the layout for certain admin routes to display those fullscreen without app menu and toolbar.
   * @private
   */
  private detectConfigMode() {
    const currentUrl = this.router.url;
    this.configFullscreen = currentUrl.startsWith("/admin/entity/");
  }

  protected readonly LoginState = LoginState;
}
