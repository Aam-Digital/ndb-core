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
import { SessionService } from "../../session/session-service/session.service";
import { Title } from "@angular/platform-browser";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatDrawerMode } from "@angular/material/sidenav";
import { ConfigService } from "../../config/config.service";
import { UiConfig } from "../ui-config";
import { ScreenWidthObserver } from "../../../utils/media/screen-size-observer.service";

/**
 * The main user interface component as root element for the app structure
 * which also ties different components together into the overall app layout.
 */
@UntilDestroy()
@Component({
  selector: "app-ui",
  templateUrl: "./ui.component.html",
  styleUrls: ["./ui.component.scss"],
})
export class UiComponent {
  /** display mode for the menu to make it responsive and usable on smaller screens */
  sideNavMode: MatDrawerMode;
  /** reference to sideNav component in template, required for toggling the menu on user actions */
  @ViewChild("sideNav") sideNav;

  /** title displayed in the app header bar */
  title = "Aam Digital";

  /** path to the image of a logo */
  logo_path: string;

  showLanguageSelect: boolean = false;

  constructor(
    private _sessionService: SessionService,
    private titleService: Title,
    private configService: ConfigService,
    private screenWidthObserver: ScreenWidthObserver
  ) {
    this.screenWidthObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe(
        (isDesktop) => (this.sideNavMode = isDesktop ? "side" : "over")
      );
    this.configService.configUpdates
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        const uiConfig =
          this.configService.getConfig<UiConfig>("appConfig") || {};
        this.title = uiConfig.site_name || this.title;
        this.titleService.setTitle(this.title);
        this.logo_path = uiConfig?.logo_path;
        this.showLanguageSelect = uiConfig?.displayLanguageSelect === true;
      });
  }

  /**
   * Check if user is logged in.
   */
  isLoggedIn(): boolean {
    return this._sessionService.isLoggedIn();
  }

  /**
   * Trigger logout of user.
   */
  logout() {
    this._sessionService.logout();
  }

  closeSidenavOnMobile() {
    if (this.sideNavMode === "over") {
      this.sideNav.close();
    }
  }
}
