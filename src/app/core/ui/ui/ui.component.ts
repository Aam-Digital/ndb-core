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

import { Component, OnInit, ViewChild } from "@angular/core";
import { SessionService } from "../../session/session-service/session.service";
import { AppConfig } from "../../app-config/app-config";
import { Title } from "@angular/platform-browser";
import { MediaObserver, MediaChange } from "@angular/flex-layout";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatDrawerMode } from "@angular/material/sidenav";
import { ConfigService } from "../../config/config.service";

/**
 * The main user interface component as root element for the app structure
 * which also ties different components together into the overall app layout.
 */
@UntilDestroy()
@Component({
  moduleId: module.id,
  selector: "app-ui",
  templateUrl: "./ui.component.html",
  styleUrls: ["./ui.component.scss"],
})
export class UiComponent implements OnInit {
  /** display mode for the menu to make it responive and usable on smaller screens */
  sideNavMode: MatDrawerMode;
  /** reference to sideNav component in template, required for toggling the menu on user actions */
  @ViewChild("sideNav") sideNav;

  /** title displayed in the app header bar */
  title: string;

  /** path to the image of a logo */
  logo_path: string;

  constructor(
    private _sessionService: SessionService,
    private titleService: Title,
    private configService: ConfigService,
    mediaObserver: MediaObserver
  ) {
    // watch screen width to change sidenav mode
    mediaObserver
      .asObservable()
      .pipe(untilDestroyed(this))
      .subscribe((change: MediaChange[]) => {
        if (change[0].mqAlias === "xs" || change[0].mqAlias === "sm") {
          this.sideNavMode = "over";
        } else {
          this.sideNavMode = "side";
        }
      });
    this.configService.configUpdated.subscribe(() => {
      this.logo_path =
        this.configService.getConfig<{ logo_path: string }>(
          "appConfig"
        )?.logo_path;
    });
  }

  ngOnInit(): void {
    this.title = AppConfig?.settings?.site_name;
    this.titleService.setTitle(this.title);
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
}
