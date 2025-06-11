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
import { AsyncPipe, NgIf } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterLink, RouterOutlet } from "@angular/router";
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
import { DemoAssistantButtonComponent } from "../../setup/demo-assistant-button/demo-assistant-button.component";
import { SetupService } from "app/core/setup/setup.service";

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
    DemoAssistantButtonComponent,
    AsyncPipe,
  ],
})
export class UiComponent {
  /** display mode for the menu to make it responsive and usable on smaller screens */
  sideNavMode: MatDrawerMode;
  /** reference to sideNav component in template, required for toggling the menu on user actions */
  @ViewChild("sideNav") sideNav;
  /** latest version of the site settings*/
  siteSettings = new SiteSettings();
  isDesktop = false;

  isConfigReady: Promise<boolean>;

  constructor(
    private screenWidthObserver: ScreenWidthObserver,
    private siteSettingsService: SiteSettingsService,
    private sessionManager: SessionManagerService,
    private setupService: SetupService,
  ) {
    this.screenWidthObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe(
        (isDesktop) => (
          (this.sideNavMode = isDesktop ? "side" : "over"),
          (this.isDesktop = isDesktop)
        ),
      );
    this.siteSettingsService.siteSettings.subscribe(
      (s) => (this.siteSettings = s),
    );

    this.isConfigReady = this.setupService.detectConfigReadyState(true);
  }

  /**
   * Trigger logout of user.
   */
  async logout() {
    this.sessionManager.logout();

    // Re-evaluate config state to update UI layout (e.g., hide toolbar and sidebar after logout)
    this.isConfigReady = this.setupService.detectConfigReadyState();
  }

  closeSidenavOnMobile() {
    if (this.sideNavMode === "over") {
      this.sideNav.close();
    }
  }
}
