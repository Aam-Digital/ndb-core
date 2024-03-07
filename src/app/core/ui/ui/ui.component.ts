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

import { Component, ViewChild } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatDrawerMode, MatSidenavModule } from "@angular/material/sidenav";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";
import { MatToolbarModule } from "@angular/material/toolbar";
import { NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterLink, RouterOutlet } from "@angular/router";
import { Angulartics2Module } from "angulartics2";
import { SearchComponent } from "../search/search.component";
import { SyncStatusComponent } from "../sync-status/sync-status/sync-status.component";
import { LanguageSelectComponent } from "../../language/language-select/language-select.component";
import { NavigationComponent } from "../navigation/navigation/navigation.component";
import { PwaInstallComponent } from "../../pwa-install/pwa-install.component";
import { AppVersionComponent } from "../latest-changes/app-version/app-version.component";
import { PrimaryActionComponent } from "../primary-action/primary-action.component";
import { SiteSettingsService } from "../../site-settings/site-settings.service";
import { DisplayImgComponent } from "../../../features/file/display-img/display-img.component";
import { SiteSettings } from "../../site-settings/site-settings";
import { LoginStateSubject } from "../../session/session-type";
import { LoginState } from "../../session/session-states/login-state.enum";
import { SessionManagerService } from "../../session/session-service/session-manager.service";

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
    NgIf,
    MatButtonModule,
    FontAwesomeModule,
    RouterLink,
    Angulartics2Module,
    SearchComponent,
    SyncStatusComponent,
    LanguageSelectComponent,
    MatSidenavModule,
    NavigationComponent,
    PwaInstallComponent,
    AppVersionComponent,
    RouterOutlet,
    PrimaryActionComponent,
    DisplayImgComponent,
  ],
  standalone: true,
})
export class UiComponent {
  /** display mode for the menu to make it responsive and usable on smaller screens */
  sideNavMode: MatDrawerMode;
  /** reference to sideNav component in template, required for toggling the menu on user actions */
  @ViewChild("sideNav") sideNav;
  /** latest version of the site settings*/
  siteSettings = new SiteSettings();

  constructor(
    private screenWidthObserver: ScreenWidthObserver,
    private siteSettingsService: SiteSettingsService,
    private loginState: LoginStateSubject,
    private sessionManager: SessionManagerService,
  ) {
    this.screenWidthObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe(
        (isDesktop) => (this.sideNavMode = isDesktop ? "side" : "over"),
      );
    this.siteSettingsService.siteSettings.subscribe(
      (s) => (this.siteSettings = s),
    );
  }

  /**
   * Check if user is logged in.
   */
  isLoggedIn(): boolean {
    return this.loginState.value === LoginState.LOGGED_IN;
  }

  /**
   * Trigger logout of user.
   */
  async logout() {
    this.sessionManager.logout();
  }

  closeSidenavOnMobile() {
    if (this.sideNavMode === "over") {
      this.sideNav.close();
    }
  }
}
