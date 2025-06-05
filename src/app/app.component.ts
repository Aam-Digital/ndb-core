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
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter } from "rxjs/operators";
import { LoginStateSubject } from "./core/session/session-type";
import { LoginState } from "./core/session/session-states/login-state.enum";
import { DemoDataInitializerService } from "./core/demo-data/demo-data-initializer.service";
import { environment } from "environments/environment";
import { ApplicationLoadingComponent } from "./core/config/dynamic-routing/empty/application-loading.component";
import { UiComponent } from "./core/ui/ui/ui.component";
import { AsyncPipe } from "@angular/common";
import { SetupService } from "./core/setup/setup.service";

/**
 * Component as the main entry point for the app.
 * Actual logic and UI structure is defined in other modules.
 */
@Component({
  selector: "app-root",
  template: `
    @if (
      !(configReady | async) && (loginState | async) !== LoginState.LOGGED_IN
    ) {
      <app-application-loading></app-application-loading>
    } @else if (configFullscreen) {
      <router-outlet></router-outlet>
    } @else {
      <app-ui></app-ui>
    }
  `,
  imports: [ApplicationLoadingComponent, UiComponent, RouterOutlet, AsyncPipe],
})
export class AppComponent {
  configFullscreen: boolean = false;
  configReady: Promise<boolean>;

  constructor(
    private router: Router,
    protected loginState: LoginStateSubject,
    private demoDataInitializer: DemoDataInitializerService,
    private setupService: SetupService,
  ) {
    this.configReady = this.setupService.detectConfigReadyState();

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
