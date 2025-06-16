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
import { filter, map } from "rxjs/operators";
import { LoginStateSubject } from "./core/session/session-type";
import { LoginState } from "./core/session/session-states/login-state.enum";
import { DemoDataInitializerService } from "./core/demo-data/demo-data-initializer.service";
import { environment } from "environments/environment";
import { SetupService } from "./core/setup/setup.service";
import { combineLatest, from, Observable } from "rxjs";

/**
 * Component as the main entry point for the app.
 * Actual logic and UI structure is defined in other modules.
 */
@Component({
  selector: "app-root",
  template: `
    @switch (displayMode$ | async) {
      @case ("loading") {
        <app-application-loading></app-application-loading>
      }
      @case ("fullscreen") {
        <router-outlet></router-outlet>
      }
      @case ("ui") {
        <app-ui></app-ui>
      }
    }
  `,
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
export class AppComponent {
  configFullscreen: boolean = false;
  displayMode$: Observable<"loading" | "fullscreen" | "ui">;

  constructor(
    private router: Router,
    protected loginState: LoginStateSubject,
    private demoDataInitializer: DemoDataInitializerService,
    private setupService: SetupService,
  ) {
    const configReady$ = from(this.setupService.waitForConfigReady());
    this.displayMode$ = combineLatest([configReady$, this.loginState]).pipe(
      map(([configReady, loginState]) => {
        if (!configReady && loginState === LoginState.LOGGED_IN) {
          return "loading";
        } else if (this.configFullscreen) {
          return "fullscreen";
        } else {
          return "ui";
        }
      }),
    );

    if (environment.demo_mode) {
      this.demoDataInitializer.logInDemoUser();
    }

    this.detectConfigMode();
    router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.detectConfigMode());
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
