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
import { MenuItem } from "../menu-item";
import { NavigationMenuConfig } from "../navigation-menu-config.interface";
import { ConfigService } from "../../config/config.service";
import { UserRoleGuard } from "../../permissions/user-role.guard";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  PREFIX_VIEW_CONFIG,
  ViewConfig,
} from "../../view/dynamic-routing/view-config.interface";

/**
 * Main app menu listing.
 */
@UntilDestroy()
@Component({
  selector: "app-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.scss"],
})
export class NavigationComponent {
  /** name of config array in the config json file */
  private readonly CONFIG_ID = "navigationMenu";
  /** all menu items to be displayed */
  public menuItems: MenuItem[] = [];

  public installText: String = '';
  public installText2: String = '';

  constructor(
    private userRoleGuard: UserRoleGuard,
    private configService: ConfigService
  ) {
    this.configService.configUpdates
      .pipe(untilDestroyed(this))
      .subscribe(() => this.initMenuItemsFromConfig());

    const userAgent = window.navigator.userAgent;

    const whichOS = () => {
      let OS = "";
      if (/iphone|ipad|ipod|macintosh/i.test(userAgent)) {
        if (window.innerWidth < 1025) {
          OS = "iOS";
        }
        else {
          OS = "MacOS";
        }
      }
      else if (/android/i.test(userAgent)) {
        OS = "Android";
      }
      else if (/windows|win32|win64|WinCE/i.test(userAgent)) {
        OS = "Windows";
      }
      else if (/linux|X11/i.test(userAgent)) {
        OS = "Linux";
      }
      return OS;
    }

    const whichBrowser = () => {
      let browser = "";
      if (/opera/i.test(userAgent)) {
        browser = "Opera";
      }
      else if (/msie|trident/i.test(userAgent)) {
        browser = "Microsoft Internet Explorer";
      }
      else if (/edg/i.test(userAgent)) {
        browser = "Edge";
      }
      else if (/chrome/i.test(userAgent)) {
        browser = "Chrome";
      }
      else if (/safari/i.test(userAgent)) {
        browser = "Safari";
        if (/crios|fxios/i.test(userAgent)) {
          browser = "Chrome";
        }
      }
      else if (/firefox/i.test(userAgent)) {
        browser = "Firefox";
      }
      else {
        browser = "other";
      }
      return browser;
    }
    

    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator['standalone']);

    const isInStandaloneText = () => {
      if (isInStandaloneMode) {
        return "standalone"
      }
      else {
        return "no standalone";
      }
    }
    // const isMobile = () => {
    //   return window.innerWidth < 1025
    // }  

    this.installText = whichOS() + ", " + whichBrowser() + ", " + isInStandaloneText();
    
    if (!isInStandaloneMode) {
      if (whichOS() === 'Android') {
        this.installText2 = 'Install directly'
      }
      else if (whichOS() === 'iOS') {
        if (whichBrowser() === 'Safari') {
          this.installText2 = 'Install instructions'
        }
      }
      else if (whichOS() === 'Windows') {
        if (whichBrowser() === 'Chrome' || whichBrowser() === 'Edge' ) {
          this.installText2 = 'Install directly'
        }
      }
      else if (whichOS() === 'MacOS') {
        if (whichBrowser() === 'Chrome' || whichBrowser() === 'Edge' ) {
          this.installText2 = 'Install directly'
        }
      }
      else if (whichOS() === 'Linux') {
        if (whichBrowser() === 'Chrome') {
          this.installText2 = 'Install directly'
        }
      }
    }
  }

  /**
   * Load menu items from config file
   */
  private initMenuItemsFromConfig() {
    this.menuItems = [];
    const config: NavigationMenuConfig = this.configService.getConfig<NavigationMenuConfig>(
      this.CONFIG_ID
    );
    for (const configItem of config.items) {
      if (this.checkMenuItemPermissions(configItem.link)) {
        this.menuItems.push(
          new MenuItem(configItem.name, configItem.icon, configItem.link)
        );
      }
    }
  }

  /**
   * Check whether the user has the required rights
   */
  private checkMenuItemPermissions(link: string): boolean {
    const configPath = link.replace(/^\//, "");
    const userRoles = this.configService.getConfig<ViewConfig>(
      PREFIX_VIEW_CONFIG + configPath
    )?.permittedUserRoles;
    return this.userRoleGuard.canActivate({
      routeConfig: { path: configPath },
      data: { permittedUserRoles: userRoles },
    } as any);
  }
}
