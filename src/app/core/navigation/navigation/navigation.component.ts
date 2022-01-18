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

  constructor(
    private userRoleGuard: UserRoleGuard,
    private configService: ConfigService
  ) {
    this.configService.configUpdates
      .pipe(untilDestroyed(this))
      .subscribe(() => this.initMenuItemsFromConfig());
    
    const whichOS = () => {
      let OS = "";
      const userAgent = window.navigator.userAgent;
      if (/iphone|ipad|ipod|macintosh/i.test(userAgent)) {
        if (window.innerWidth < 1025) {
          OS = "iOS";
        }
        else {
          OS = "MacOS";
        }
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
      if (navigator.userAgent.indexOf('Opera') != -1) {
        browser = "Opera";
      }
      else if (navigator.userAgent.indexOf('MSIE') != -1) {
        browser = "Microsoft Internet Explorer";
      }
      else if (navigator.userAgent.indexOf('MSIE') != -1) {
        browser = "Microsoft Internet Explorer";
      }
      else if (navigator.userAgent.indexOf('Trident') != -1) {
        browser = "Microsoft Internet Explorer";
      }
      else if (navigator.userAgent.indexOf('Chrome') != -1) {
        browser = "Chrome";
      }
      else if (navigator.userAgent.indexOf('Safari') != -1) {
        browser = "Safari";
        if (navigator.userAgent.indexOf('CriOS') != -1) {
          browser = "Chrome";
        }
      }
      else if (navigator.userAgent.indexOf('Firefox') != -1) {
        browser = "Firefox";
      }
      return browser;
    }
    


    // Detects if device is in standalone mode
    const isInStandaloneMode = () => ('standalone' in window.navigator); // && (window.navigator.standalone);
    
    // Detects if device is on iOS
    const isSafari = () => {
      return navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
          navigator.userAgent &&
          navigator.userAgent.indexOf('CriOS') === -1 &&
          navigator.userAgent.indexOf('FxiOS') === -1;
    }       

    const isMobile = () => {
      return window.innerWidth < 1025
    }  


    if (!isInStandaloneMode()) {
      this.installText = this.installText + ", kein Standalone";
    }

    this.installText = whichOS() + ", " + whichBrowser(); // window.navigator.userAgent + " ---isMobile: " + isMobile();
    console.log("UserAgent: "+  window.navigator.userAgent);

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
