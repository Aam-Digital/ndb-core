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
import { map, mergeMap, tap } from "rxjs/operators";
import { LoginStateSubject } from "./core/session/session-type";
import { LoginState } from "./core/session/session-states/login-state.enum";
import { DemoDataInitializerService } from "./core/demo-data/demo-data-initializer.service";
import { environment } from "environments/environment";
import { SetupService } from "./core/setup/setup.service";
import { from, merge, Observable, of } from "rxjs";

/**
 * Component as the main entry point for the app.
 * Actual logic and UI structure is defined in other modules.
 */
@Component({
  selector: "app-root",
  template: `
    @if (configReady$ | async) {
      <app-ui></app-ui>
    } @else {
      <app-application-loading></app-application-loading>
    }
  `,
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
export class AppComponent {
  configReady$: Observable<boolean>;

  constructor(
    private loginState: LoginStateSubject,
    private demoDataInitializer: DemoDataInitializerService,
    private setupService: SetupService,
  ) {
    this.configReady$ = this.loginState.pipe(
      // if logged out, we don't wait for config and treat this separately
      map((loginState) => loginState !== LoginState.LOGGED_IN),
      // immediately switch the state based on loginState but then take time for config readiness
      mergeMap((loggedOut) => {
        if (!loggedOut) {
          return merge(of(false), from(this.setupService.waitForConfigReady()));
        } else {
          return of(true);
        }
      }),
      tap((ready) => console.log("app config ready:", ready)),
    );

    if (environment.demo_mode) {
      this.demoDataInitializer.logInDemoUser();
    }
  }
}
