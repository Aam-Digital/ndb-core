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

import { Component, inject, signal, Signal, ViewChild } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatDrawerMode, MatSidenavModule } from "@angular/material/sidenav";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { MatToolbarModule } from "@angular/material/toolbar";
import { AsyncPipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from "@angular/router";
import { Angulartics2Module } from "angulartics2";
import { SearchComponent } from "../search/search.component";
import { SyncStatusComponent } from "../sync-status/sync-status/sync-status.component";
import { NavigationComponent } from "../navigation/navigation/navigation.component";
import { PwaInstallComponent } from "../../pwa-install/pwa-install.component";
import { AppVersionComponent } from "../latest-changes/app-version/app-version.component";
import { PrimaryActionComponent } from "../primary-action/primary-action.component";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { DisplayImgComponent } from "../../../features/file/display-img/display-img.component";
import { SiteSettings } from "../../site-settings/site-settings";
import { SessionManagerService } from "../../session/session-service/session-manager.service";
import { SetupWizardButtonComponent } from "../../admin/setup-wizard/setup-wizard-button/setup-wizard-button.component";
import { NotificationComponent } from "../../../features/notification/notification.component";
import { GotoThirdPartySystemComponent } from "../../../features/third-party-authentication/goto-third-party-system/goto-third-party-system.component";
import { SetupService } from "app/core/setup/setup.service";
import { AssistantButtonComponent } from "../../setup/assistant-button/assistant-button.component";
import { filter, map } from "rxjs/operators";
import { BehaviorSubject } from "rxjs";
import { LoginStateSubject } from "../../session/session-type";
import { toSignal } from "@angular/core/rxjs-interop";
import { LoginState } from "../../session/session-states/login-state.enum";
import { ConfigService } from "../../config/config.service";
import { SessionSubject } from "../../session/auth/session-info";

/**
 * The main user interface component as root element for the app structure
 * which also ties different components together into the overall app layout.
 */
@UntilDestroy()
@Component({
  selector: "app-ui",
  templateUrl: "./ui.component.html",
  styleUrls: ["./ui.component.scss"],
  imports: [
    MatToolbarModule,
    MatButtonModule,
    FontAwesomeModule,
    RouterLink,
    Angulartics2Module,
    SearchComponent,
    SyncStatusComponent,
    MatSidenavModule,
    NavigationComponent,
    PwaInstallComponent,
    AppVersionComponent,
    RouterOutlet,
    PrimaryActionComponent,
    DisplayImgComponent,
    SetupWizardButtonComponent,
    NotificationComponent,
    GotoThirdPartySystemComponent,
    AssistantButtonComponent,
    AsyncPipe,
  ],
})
export class UiComponent {
  private screenWidthObserver = inject(ScreenWidthObserver);
  private siteSettingsService = inject(SiteSettingsService);
  private sessionManager = inject(SessionManagerService);
  private setupService = inject(SetupService);
  private router = inject(Router);
  private loginState = inject(LoginStateSubject);
  private configService = inject(ConfigService);
  private readonly sessionSubject = inject(SessionSubject);

  /** display mode for the menu to make it responsive and usable on smaller screens */
  sideNavMode: MatDrawerMode;

  /** reference to sideNav component in template, required for toggling the menu on user actions */
  @ViewChild("sideNav") sideNav;

  /** latest version of the site settings*/
  siteSettings = new SiteSettings();
  isDesktop = false;
  isLoggedIn: Signal<boolean> = toSignal(
    this.loginState.pipe(
      map((loginState) => loginState === LoginState.LOGGED_IN),
    ),
    { initialValue: false },
  );

  configReady$ = new BehaviorSubject<boolean>(false);
  showPrimaryAction = signal(false);

  constructor() {
    this.screenWidthObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe((isDesktop) => {
        this.isDesktop = isDesktop;
        this.updateDisplayMode();
      });
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.updateDisplayMode());
    this.configReady$.subscribe((ready) => this.updateDisplayMode());

    this.siteSettingsService.siteSettings.subscribe(
      (s) => (this.siteSettings = s),
    );

    if (this.configService.hasConfig()) {
      this.configReady$.next(true);
    } else {
      this.setupService
        .waitForConfigReady(true)
        .then((ready) => this.configReady$.next(ready));
    }
  }

  private updateDisplayMode() {
    const currentUrl = this.router.url;
    const configFullscreen =
      currentUrl.startsWith("/admin/entity/") ||
      currentUrl.startsWith("/admin/dashboard") ||
      currentUrl.startsWith("/admin/matching");

    this.sideNavMode = configFullscreen || !this.isDesktop ? "over" : "side";
    this.showPrimaryAction.set(this.configReady$.value && !configFullscreen);
  }

  /**
   * Trigger logout of user.
   */
  async logout() {
    this.sessionManager.logout();

    // Re-evaluate config state to update UI layout (e.g., hide toolbar and sidebar after logout)
    this.setupService
      .waitForConfigReady()
      .then((ready) => this.configReady$.next(ready));
  }

  closeSidenavOnMobile() {
    if (this.sideNavMode === "over") {
      this.sideNav.close();
    }
  }

  isAdminUser = toSignal(
    this.sessionSubject.pipe(
      map((session) => session?.roles?.includes("admin_app") ?? false),
    ),
    { initialValue: false },
  );

  navigateToProfile(): void {
    this.closeSidenavOnMobile();
    this.router.navigate(["user-account"]);
  }
}
